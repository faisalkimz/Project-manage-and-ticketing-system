export const useToast = () => {
  const showToast = (message, type = 'info') => {
    // Simple console-based toast for now
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  return { showToast };
};
