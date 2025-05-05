# CrediKhaata - Loan Ledger UI for Shopkeepers

## Overview

CrediKhaata is a React.js-based web application designed for small shopkeepers to manage customer credit, track transactions, record repayments, and view outstanding balances. This application provides a simple and intuitive dashboard to streamline credit management.

## Features

-   **Login/Sign-Up:**
    -   Basic email-password authentication flow.
    -   Persistent login state using `localStorage` or Context API.
-   **Dashboard View:**
    -   List of all customers with:
        -   Name
        -   Outstanding balance
        -   Next due date (calculated from loan data)
        -   Status: Up-to-date / Overdue
-   **Customer Detail Page:**
    -   Detailed view of all credit transactions for a specific customer:
        -   Item sold
        -   Loan amount
        -   Due date
        -   Repayment history (amount + date)
    -   Remaining balance per loan.
-   **Forms:**
    -   Add New Customer Form
    -   Add Loan (Credit Sale) Form
    -   Record Repayment Form
    -   Client-side form validation.
-   **Overdue Highlighting:**
    -   Visual highlighting of overdue loans on the Dashboard or Loan List.
-   **Mobile-Responsive Design:**
    -   Application is designed to be responsive and accessible on both desktop and mobile browsers.
-   **Export Customer Statement:**
    -   Ability to export customer statements as downloadable PDF files.
-   **Toasts/Snackbars:**
    -   Notifications for success/error states to provide user feedback.
-   **Dark Mode Toggle:**
    -   Option to switch between light and dark themes for user preference.

## Technologies Used

-   **React (v18+):** JavaScript library for building user interfaces.
-   **Hooks:** Functional components with React Hooks for state management and side effects.
-   **State Management:** Context API
-   **Axios/fetch:** For making API calls to fetch and manage data.
-   **CSS Framework:** Tailwind CSS
-   **Form Validation:** react-hook-form
-   **PDF Generation:** jspdf

## Installation

1.  **Clone the repository:**

    `git clone [repository-url]`
2.  **Navigate to the project directory:**

    `cd credikhaata-app`
3.  **Install dependencies:**

    `npm install` or `yarn install`
4.  **Start the application:**

    `npm start` or `yarn start`

## Configuration

-   API endpoints and other configurations can be set in the `.env` file.  Ensure the `.env` file is properly configured before running the application.

## Usage

1.  **Login/Sign-Up:**
    -   Use the provided authentication flow to create a new account or log in to an existing one.
2.  **Dashboard:**
    -   View a list of all customers with their outstanding balances, due dates, and status.
3.  **Customer Detail Page:**
    -   Click on a customer to view detailed transaction history, loan information, and repayment records.
4.  **Forms:**
    -   Use the forms to add new customers, record credit sales (loans), and track repayments.
5.  **Overdue Highlighting:**
    -   Overdue loans are highlighted in red to quickly identify and manage overdue payments.
6.  **Export Customer Statement:**
    -   Generate and download PDF statements for individual customers.
7.  **Dark Mode:**
    -   Toggle between light and dark mode for comfortable viewing.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request with your changes.  Ensure all contributions align with the project’s coding standards and include appropriate tests.
