"use client";
import React from "react";

function MainComponent() {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/crediKhaata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "listCustomers" }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }

      const data = await response.json();
      // Transform and sort customers by total_credit (highest to lowest)
      const sortedCustomers = data
        .map((customer) => ({
          ...customer,
          total_credit: parseFloat(customer.total_credit) || 0,
        }))
        .sort((a, b) => b.total_credit - a.total_credit);

      setCustomers(sortedCustomers);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError("Failed to load customers");
      setLoading(false);
    }
  };

  const handleAddCustomer = async (customerData) => {
    try {
      const response = await fetch("/api/crediKhaata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addCustomer",
          customerData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add customer");
      }

      await fetchCustomers();
      setShowAddCustomer(false);
    } catch (err) {
      console.error(err);
      setError("Failed to add customer");
    }
  };

  const handleAddTransaction = async (transactionData) => {
    try {
      const response = await fetch("/api/crediKhaata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "addTransaction",
          transactionData,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add transaction");
      }

      await fetchCustomers();
      if (selectedCustomer) {
        await fetchCustomerDetails(selectedCustomer.customer.id);
      }
      setShowAddTransaction(false);
    } catch (err) {
      console.error(err);
      setError("Failed to add transaction");
    }
  };

  const fetchCustomerDetails = async (customerId) => {
    try {
      const response = await fetch("/api/crediKhaata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "getCustomerDetails",
          customerId,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch customer details: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.customer || !data.loans) {
        throw new Error("Invalid response format from server");
      }

      setSelectedCustomer({
        customer: {
          ...data.customer,
          total_credit: parseFloat(data.customer.total_credit) || 0,
        },
        loans: data.loans.map((loan) => ({
          ...loan,
          credit_amount: parseFloat(loan.credit_amount),
          total_paid: parseFloat(loan.total_paid),
          remaining_balance: parseFloat(loan.remaining_balance),
          payments: (loan.payments || []).map((payment) => ({
            ...payment,
            amount: parseFloat(payment.amount),
          })),
        })),
      });
    } catch (err) {
      console.error("Error fetching customer details:", err);
      setError(err.message || "Failed to load customer details");
      setSelectedCustomer(null);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    try {
      const response = await fetch("/api/crediKhaata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "deleteCustomer",
          customerId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete customer");
      }

      setSelectedCustomer(null);
      setShowDeleteConfirmation(false);
      await fetchCustomers();
    } catch (err) {
      console.error(err);
      setError("Failed to delete customer");
    }
  };

  const AddCustomerForm = () => {
    const [formData, setFormData] = useState({
      name: "",
      phone: "",
      address: "",
    });
    const [errors, setErrors] = useState({});

    const validateForm = () => {
      const newErrors = {};

      // Name validation
      if (!formData.name.trim()) {
        newErrors.name = "Name is required";
      } else if (formData.name.length < 2) {
        newErrors.name = "Name must be at least 2 characters";
      }

      // Phone validation (optional but must be valid if provided)
      if (formData.phone) {
        const phoneRegex = /^[+]?[\d\s-]{10,}$/;
        if (!phoneRegex.test(formData.phone)) {
          newErrors.phone = "Please enter a valid phone number";
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      // Clear error when user starts typing
      if (errors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: undefined,
        }));
      }
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (validateForm()) {
        handleAddCustomer(formData);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Add New Customer</h2>
            <button
              onClick={() => setShowAddCustomer(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter customer name"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${
                  errors.phone ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter phone number"
              />
              {errors.phone && (
                <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full p-2 border rounded border-gray-300"
                rows="3"
                placeholder="Enter address"
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowAddCustomer(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Customer
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const AddTransactionForm = () => {
    const [formData, setFormData] = useState({
      customerId: "",
      amount: "",
      type: "credit",
      description: "",
      dueDate: "",
    });
    const [errors, setErrors] = useState({});

    const validateForm = () => {
      const newErrors = {};

      // Customer validation
      if (!formData.customerId) {
        newErrors.customerId = "Please select a customer";
      }

      // Amount validation
      if (!formData.amount) {
        newErrors.amount = "Amount is required";
      } else {
        const amount = parseFloat(formData.amount);
        if (isNaN(amount) || amount <= 0) {
          newErrors.amount = "Please enter a valid positive amount";
        }
      }

      // Due date validation for credit transactions
      if (formData.type === "credit") {
        if (!formData.dueDate) {
          newErrors.dueDate = "Due date is required for credit";
        } else {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const selectedDate = new Date(formData.dueDate);
          if (selectedDate < today) {
            newErrors.dueDate = "Due date cannot be in the past";
          }
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      // Clear error when user starts typing
      if (errors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: undefined,
        }));
      }
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (validateForm()) {
        handleAddTransaction({
          customer_id: parseInt(formData.customerId),
          amount: parseFloat(formData.amount),
          type: formData.type,
          description: formData.description,
          due_date: formData.type === "credit" ? formData.dueDate : null,
        });
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {formData.type === "credit" ? "Add New Credit" : "Record Payment"}
            </h2>
            <button
              onClick={() => setShowAddTransaction(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer *
              </label>
              <select
                name="customerId"
                value={formData.customerId}
                onChange={handleChange}
                className={`w-full p-2 border rounded ${
                  errors.customerId ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              {errors.customerId && (
                <p className="text-red-500 text-sm mt-1">{errors.customerId}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Type *
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="credit"
                    checked={formData.type === "credit"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Credit (Add to dues)
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="payment"
                    checked={formData.type === "payment"}
                    onChange={handleChange}
                    className="mr-2"
                  />
                  Payment (Reduce dues)
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">₹</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  className={`w-full p-2 pl-7 border rounded ${
                    errors.amount ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                />
              </div>
              {errors.amount && (
                <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
              )}
            </div>

            {formData.type === "credit" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date *
                </label>
                <input
                  type="date"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className={`w-full p-2 border rounded ${
                    errors.dueDate ? "border-red-500" : "border-gray-300"
                  }`}
                  min={new Date().toISOString().split("T")[0]}
                />
                {errors.dueDate && (
                  <p className="text-red-500 text-sm mt-1">{errors.dueDate}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full p-2 border rounded border-gray-300"
                rows="2"
                placeholder={
                  formData.type === "credit"
                    ? "What was sold?"
                    : "Payment details"
                }
              />
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => setShowAddTransaction(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {formData.type === "credit" ? "Add Credit" : "Record Payment"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4 md:mb-0">
              CrediKhaata - Loan Ledger
            </h1>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAddCustomer(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Add Customer
              </button>
              <button
                onClick={() => setShowAddTransaction(true)}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Add Transaction
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-10">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customers.map((customer) => (
              <div
                key={customer.id}
                className={`bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow cursor-pointer
                  ${
                    customer.status === "overdue"
                      ? "border-l-4 border-red-500 bg-red-50"
                      : "border-l-4 border-green-500"
                  }`}
                onClick={() => fetchCustomerDetails(customer.id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{customer.name}</h3>
                    {customer.status === "overdue" && (
                      <span className="text-red-500">⚠️</span>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full 
                      ${
                        customer.status === "overdue"
                          ? "bg-red-100 text-red-800 border border-red-200"
                          : "bg-green-100 text-green-800 border border-green-200"
                      }`}
                  >
                    {customer.status === "overdue" ? "Overdue" : "Up to date"}
                  </span>
                </div>
                <p className="text-gray-600 mb-2">{customer.phone}</p>
                <p className="text-gray-600 mb-4 text-sm">{customer.address}</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Credit:</span>
                    <span
                      className={`font-bold ${
                        customer.total_credit > 0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      ₹{customer.total_credit.toFixed(2)}
                    </span>
                  </div>
                  {customer.next_due_date && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Next Due:</span>
                      <span
                        className={`font-medium ${
                          new Date(customer.next_due_date) < new Date()
                            ? "text-red-600"
                            : "text-gray-600"
                        }`}
                      >
                        {new Date(customer.next_due_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedCustomer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              {/* Customer Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold">
                      {selectedCustomer.customer.name}
                    </h2>
                    {selectedCustomer.customer.status === "overdue" && (
                      <span className="text-red-500 text-xl">⚠️</span>
                    )}
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full ${
                        selectedCustomer.customer.status === "overdue"
                          ? "bg-red-100 text-red-800 border border-red-200"
                          : "bg-green-100 text-green-800 border border-green-200"
                      }`}
                    >
                      {selectedCustomer.customer.status === "overdue"
                        ? "Overdue"
                        : "Up to date"}
                    </span>
                  </div>
                  <p className="text-gray-600">
                    {selectedCustomer.customer.phone}
                  </p>
                  <p className="text-gray-600">
                    {selectedCustomer.customer.address}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteConfirmation(true)}
                    className="px-3 py-1 text-red-600 hover:text-red-800"
                  >
                    Delete Customer
                  </button>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Total Outstanding */}
              <div
                className={`mb-6 p-4 rounded-lg ${
                  selectedCustomer.customer.total_credit > 0
                    ? "bg-red-50 border border-red-200"
                    : "bg-green-50 border border-green-200"
                }`}
              >
                <h3 className="text-xl font-semibold mb-2">
                  Total Outstanding
                </h3>
                <p
                  className={`text-2xl font-bold ${
                    selectedCustomer.customer.total_credit > 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  ₹{selectedCustomer.customer.total_credit.toFixed(2)}
                </p>
              </div>

              {/* Loans List */}
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Loans & Repayments</h3>

                {selectedCustomer.loans.map((loan) => (
                  <div
                    key={loan.id}
                    className={`bg-white border rounded-lg ${
                      loan.is_overdue
                        ? "border-red-300 shadow-sm bg-red-50"
                        : loan.remaining_balance > 0
                        ? "border-yellow-300 shadow-sm bg-yellow-50"
                        : "border-green-300 shadow-sm bg-green-50"
                    }`}
                  >
                    {/* Loan Header */}
                    <div className="p-4 border-b bg-white bg-opacity-50 rounded-t-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-lg">
                            {loan.item_sold || "Credit"}
                          </h4>
                          {loan.is_overdue && (
                            <span className="text-red-500">⚠️</span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            ₹{loan.credit_amount.toFixed(2)}
                          </p>
                          <p
                            className={`text-sm ${
                              loan.is_overdue
                                ? "text-red-600 font-medium"
                                : "text-gray-600"
                            }`}
                          >
                            Due: {new Date(loan.due_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Payment Progress</span>
                          <span>
                            ₹{loan.total_paid.toFixed(2)} of ₹
                            {loan.credit_amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className={`h-2.5 rounded-full transition-all ${
                              loan.remaining_balance === 0
                                ? "bg-green-500"
                                : loan.is_overdue
                                ? "bg-red-500"
                                : "bg-blue-500"
                            }`}
                            style={{
                              width: `${
                                (loan.total_paid / loan.credit_amount) * 100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Remaining Balance */}
                      <div className="mt-4 flex justify-between items-center p-2 rounded bg-white">
                        <span className="text-sm font-medium">
                          Remaining Balance:
                        </span>
                        <span
                          className={`font-bold ${
                            loan.remaining_balance > 0
                              ? loan.is_overdue
                                ? "text-red-600"
                                : "text-yellow-600"
                              : "text-green-600"
                          }`}
                        >
                          ₹{loan.remaining_balance.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Payment History */}
                    {loan.payments.length > 0 && (
                      <div className="p-4">
                        <h5 className="font-medium mb-2">Payment History</h5>
                        <div className="space-y-2">
                          {loan.payments.map((payment, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center text-sm bg-white p-3 rounded"
                            >
                              <div>
                                <p className="font-medium text-green-800">
                                  ₹{payment.amount.toFixed(2)}
                                </p>
                                {payment.description && (
                                  <p className="text-gray-600 text-xs">
                                    {payment.description}
                                  </p>
                                )}
                              </div>
                              <p className="text-gray-600">
                                {new Date(payment.date).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {showAddCustomer && <AddCustomerForm />}
        {showAddTransaction && <AddTransactionForm />}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Delete Customer</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {selectedCustomer.customer.name}?
              This will also delete all their transaction history and cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirmation(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleDeleteCustomer(selectedCustomer.customer.id)
                }
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainComponent;