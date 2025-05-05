async function handler({ action, customerId, customerData, transactionData }) {
  switch (action) {
    case "listCustomers":
      // Get customers with their status and next due date
      return await sql`
        WITH NextDueDates AS (
          SELECT 
            customer_id,
            MIN(due_date) as next_due_date
          FROM transactions
          WHERE due_date >= CURRENT_DATE
          GROUP BY customer_id
        ),
        OverdueStatus AS (
          SELECT DISTINCT
            customer_id,
            CASE 
              WHEN EXISTS (
                SELECT 1 
                FROM transactions t2 
                WHERE t2.customer_id = transactions.customer_id 
                AND t2.due_date < CURRENT_DATE
                AND t2.type = 'credit'
              ) THEN 'overdue'
              ELSE 'up-to-date'
            END as current_status
          FROM transactions
        )
        SELECT 
          c.*,
          COALESCE(ndd.next_due_date, NULL) as next_due_date,
          COALESCE(os.current_status, 'up-to-date') as status
        FROM customers c
        LEFT JOIN NextDueDates ndd ON c.id = ndd.customer_id
        LEFT JOIN OverdueStatus os ON c.id = os.customer_id
        ORDER BY 
          CASE 
            WHEN os.current_status = 'overdue' THEN 0 
            ELSE 1 
          END,
          COALESCE(ndd.next_due_date, '9999-12-31')
      `;

    case "addCustomer":
      const { name, phone, address } = customerData;
      const newCustomer = await sql`
        INSERT INTO customers (name, phone, address)
        VALUES (${name}, ${phone}, ${address})
        RETURNING *
      `;
      return newCustomer[0];

    case "addTransaction":
      const { customer_id, amount, type, description, due_date } =
        transactionData;
      await sql.transaction(async (sql) => {
        // Add the transaction
        await sql`
          INSERT INTO transactions (customer_id, amount, type, description, due_date)
          VALUES (${customer_id}, ${amount}, ${type}, ${description}, ${due_date})
        `;

        // Update customer's total credit
        const creditChange = type === "credit" ? amount : -amount;
        await sql`
          UPDATE customers 
          SET total_credit = total_credit + ${creditChange}
          WHERE id = ${customer_id}
        `;

        // Update customer's next due date and status
        await sql`
          WITH NextDueDate AS (
            SELECT MIN(due_date) as next_due_date
            FROM transactions
            WHERE customer_id = ${customer_id}
            AND due_date >= CURRENT_DATE
          ),
          OverdueStatus AS (
            SELECT 
              CASE 
                WHEN EXISTS (
                  SELECT 1 
                  FROM transactions 
                  WHERE customer_id = ${customer_id}
                  AND due_date < CURRENT_DATE
                  AND type = 'credit'
                ) THEN 'overdue'
                ELSE 'up-to-date'
              END as status
          )
          UPDATE customers
          SET 
            next_due_date = (SELECT next_due_date FROM NextDueDate),
            status = (SELECT status FROM OverdueStatus)
          WHERE id = ${customer_id}
        `;
      });
      return { success: true };

    case "getCustomerDetails":
      // First get the customer details
      const customer = await sql`
        SELECT * FROM customers 
        WHERE id = ${customerId}
      `;

      if (customer.length === 0) {
        return { error: "Customer not found" };
      }

      // Then get all transactions for this customer
      const transactions = await sql`
        SELECT 
          t.*,
          CASE 
            WHEN t.type = 'credit' AND t.due_date < CURRENT_DATE AND 
              (SELECT COALESCE(SUM(amount), 0) 
               FROM transactions 
               WHERE customer_id = ${customerId} 
               AND type = 'payment' 
               AND transaction_date >= t.transaction_date) < t.amount
            THEN true 
            ELSE false 
          END as is_overdue
        FROM transactions t
        WHERE t.customer_id = ${customerId}
        ORDER BY t.transaction_date DESC
      `;

      // Group transactions into loans
      const loans = transactions
        .filter((t) => t.type === "credit")
        .map((credit) => {
          const payments = transactions
            .filter(
              (t) =>
                t.type === "payment" &&
                t.transaction_date >= credit.transaction_date
            )
            .map((payment) => ({
              amount: parseFloat(payment.amount),
              date: payment.transaction_date,
              description: payment.description,
            }));

          const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
          const creditAmount = parseFloat(credit.amount);

          return {
            id: credit.id,
            credit_amount: creditAmount,
            item_sold: credit.description || "Credit",
            due_date: credit.due_date,
            credit_date: credit.transaction_date,
            total_paid: totalPaid,
            remaining_balance: creditAmount - totalPaid,
            is_overdue: credit.is_overdue,
            payments,
          };
        })
        .sort((a, b) => {
          // Sort overdue first, then by due date
          if (a.is_overdue && !b.is_overdue) return -1;
          if (!a.is_overdue && b.is_overdue) return 1;
          return new Date(a.due_date) - new Date(b.due_date);
        });

      return {
        customer: {
          ...customer[0],
          total_credit: parseFloat(customer[0].total_credit),
        },
        loans,
      };

    case "deleteCustomer":
      try {
        const result = await sql`
          DELETE FROM customers 
          WHERE id = ${customerId}
          RETURNING id
        `;

        if (result.length === 0) {
          return { error: "Customer not found" };
        }

        return { success: true };
      } catch (error) {
        console.error("Error deleting customer:", error);
        return { error: "Failed to delete customer" };
      }

    default:
      return null;
  }
}
export async function POST(request) {
  return handler(await request.json());
}