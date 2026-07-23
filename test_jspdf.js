import jsPDF from 'jspdf';
try {
  const pdf = new jsPDF();
  console.log("jsPDF success");
} catch (e) {
  console.log("jsPDF error:", e.message);
}
