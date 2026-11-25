export const SETTINGS_FIELDS = {
    netMonthlySalaryEur: {
        label: 'Net monthly salary (€)',
        description:
            'Starting salary of the House planner, used to check how heavy a loan payment is.',
        errorMessage: 'Enter your net monthly salary, e.g. 2100',
    },
    emergencyFundGoalEur: {
        label: 'Emergency fund goal (€)',
        description: 'Target of the Emergency Fund page and the Goals card on the dashboard.',
        errorMessage: 'Enter a goal above zero, e.g. 5000',
    },
} as const
