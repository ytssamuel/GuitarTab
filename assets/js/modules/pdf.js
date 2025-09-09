// PDF export module
export function exportToPDF({ element, filename }) {
  if (!window.html2pdf) {
    console.warn('html2pdf not loaded');
    return;
  }
  const opt = {
    margin: 10,
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };
  window.html2pdf().set(opt).from(element).save();
}
