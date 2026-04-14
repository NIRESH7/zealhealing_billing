/**
 * Utility to generate and download a sample CSV template for transaction uploads.
 */
export const downloadTransactionTemplate = () => {
  const headers = ["Name", "Phone", "Transaction ID", "Amount", "Product"];
  const sampleData = [
    ["Ramesh Kumar", "9876543211", "TXN123456789", "10000", "Advanced Digital Marketing Course"],
    ["Suresh Raina", "9876543212", "TXN123456790", "5000", "Python Programming"],
    ["Anita Singh", "9876543213", "TXN123456791", "2500", "Basic Excel"]
  ];

  const csvContent = [
    headers.join(","),
    ...sampleData.map(row => row.join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", "transaction_template.csv");
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
