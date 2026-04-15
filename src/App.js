import { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
import logoImage from './logo.png';

function App() {
  const [items, setItems] = useState([{ name: '', qty: 1, price: 0 }]);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [invoiceNum, setInvoiceNum] = useState('INV-001');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');
  const [taxPercent, setTaxPercent] = useState(0);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [notes, setNotes] = useState('Thank you for your business! Payment within 15 days please.');
  const logo = logoImage;
  const [signature, setSignature] = useState(null);
  const [bankName, setBankName] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [savedInvoices, setSavedInvoices] = useState([]);
  const [savedClients, setSavedClients] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const invoiceRef = useRef();

  useEffect(() => {
    const savedInv = localStorage.getItem('invoicepak-history');
    if (savedInv) {
      const history = JSON.parse(savedInv);
      setSavedInvoices(history);
      if (history.length > 0) {
        const lastNum = parseInt(history[history.length - 1].invoiceNum.split('-')[1]);
        setInvoiceNum(`INV-${String(lastNum + 1).padStart(3, '0')}`);
      }
    }
    const savedCli = localStorage.getItem('invoicepak-clients');
    if (savedCli) setSavedClients(JSON.parse(savedCli));
    const savedDark = localStorage.getItem('invoicepak-dark');
    if (savedDark) setDarkMode(JSON.parse(savedDark));
    const savedBank = localStorage.getItem('invoicepak-bank');
    if (savedBank) {
      const bank = JSON.parse(savedBank);
      setBankName(bank.bankName);
      setAccountTitle(bank.accountTitle);
      setAccountNumber(bank.accountNumber);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('invoicepak-dark', JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const bankData = { bankName, accountTitle, accountNumber };
    localStorage.setItem('invoicepak-bank', JSON.stringify(bankData));
  }, [bankName, accountTitle, accountNumber]);

  const addItem = () => setItems([...items, { name: '', qty: 1, price: 0 }]);

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItem = (index) => setItems(items.filter((_, i) => i!== index));

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) setSignature(URL.createObjectURL(file));
  };

  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price), 0);
  const taxAmount = (subtotal * taxPercent) / 100;
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = subtotal + taxAmount - discountAmount;

  const saveInvoice = () => {
    if (clientName && clientEmail) {
      const clientExists = savedClients.find(c => c.email === clientEmail);
      if (!clientExists) {
        const newClients = [...savedClients, { name: clientName, email: clientEmail }];
        setSavedClients(newClients);
        localStorage.setItem('invoicepak-clients', JSON.stringify(newClients));
      }
    }

    const invoiceData = {
      invoiceNum, invoiceDate, dueDate, clientName, clientEmail, items,
      subtotal, taxPercent, discountPercent, taxAmount, discountAmount, total, notes,
      savedAt: new Date().toLocaleString()
    };
    const updated = [...savedInvoices, invoiceData];
    setSavedInvoices(updated);
    localStorage.setItem('invoicepak-history', JSON.stringify(updated));
    alert('Invoice Saved! ✅');
    const nextNum = parseInt(invoiceNum.split('-')[1]) + 1;
    setInvoiceNum(`INV-${String(nextNum).padStart(3, '0')}`);
    clearForm();
  };

  const loadInvoice = (invoice) => {
    setInvoiceNum(invoice.invoiceNum);
    setInvoiceDate(invoice.invoiceDate);
    setDueDate(invoice.dueDate);
    setClientName(invoice.clientName);
    setClientEmail(invoice.clientEmail);
    setItems(invoice.items);
    setTaxPercent(invoice.taxPercent);
    setDiscountPercent(invoice.discountPercent);
    setNotes(invoice.notes);
    setShowHistory(false);
  };

  const loadClient = (e) => {
    const email = e.target.value;
    const client = savedClients.find(c => c.email === email);
    if (client) {
      setClientName(client.name);
      setClientEmail(client.email);
    }
  };

  const deleteInvoice = (index) => {
    const updated = savedInvoices.filter((_, i) => i!== index);
    setSavedInvoices(updated);
    localStorage.setItem('invoicepak-history', JSON.stringify(updated));
  };

  const clearForm = () => {
    setClientName('');
    setClientEmail('');
    setItems([{ name: '', qty: 1, price: 0 }]);
    setTaxPercent(0);
    setDiscountPercent(0);
    setDueDate('');
    setNotes('Thank you for your business! Payment within 15 days please.');
  };

  const downloadPDF = async () => {
    setIsPrinting(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const input = invoiceRef.current;
    html2canvas(input, {
      scale: 2, useCORS: true, logging: false,
      backgroundColor: darkMode? '#1f2937' : '#ffffff',
      windowWidth: input.scrollWidth, windowHeight: input.scrollHeight
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeight);
      pdf.save(`${invoiceNum}-InvoicePak.pdf`);
      setIsPrinting(false);
    });
  };

  const bgColor = darkMode? 'bg-gray-900' : 'bg-gray-100';
  const cardColor = darkMode? 'bg-gray-800' : 'bg-white';
  const textColor = darkMode? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode? 'text-gray-400' : 'text-gray-600';
  const inputBg = darkMode? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300';
  const qrValue = `Bank: ${bankName}\nA/C Title: ${accountTitle}\nA/C #: ${accountNumber}\nAmount: Rs. ${total.toFixed(2)}\nInvoice: ${invoiceNum}`;

  return (
    <div className={`min-h-screen ${bgColor} p-8 transition-colors`}>
      <div className="max-w-4xl mx-auto mb-4 flex justify-between items-center">
        <button onClick={() => setShowHistory(!showHistory)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700">
          📚 History ({savedInvoices.length})
        </button>
        <button onClick={() => setDarkMode(!darkMode)} className="bg-gray-700 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-600">
          {darkMode? '☀️ Light' : '🌙 Dark'}
        </button>
      </div>

      {showHistory && (
        <div className={`max-w-4xl mx-auto mb-6 ${cardColor} p-6 rounded-lg shadow-lg`}>
          <h2 className={`text-xl font-bold mb-4 ${textColor}`}>Saved Invoices</h2>
          {savedInvoices.length === 0? <p className={textSecondary}>No saved invoices yet</p> : (
            <div className="space-y-2">
              {savedInvoices.map((inv, idx) => (
                <div key={idx} className={`flex justify-between items-center p-3 rounded ${darkMode? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div>
                    <p className={`font-bold ${textColor}`}>{inv.invoiceNum} - {inv.clientName || 'No Name'}</p>
                    <p className={`text-sm ${textSecondary}`}>Rs. {inv.total.toFixed(2)} | {inv.savedAt}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => loadInvoice(inv)} className="bg-blue-500 text-white px-3 py-1 rounded text-sm">Load</button>
                    <button onClick={() => deleteInvoice(idx)} className="bg-red-500 text-white px-3 py-1 rounded text-sm">Del</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {!isPrinting && (
        <div className={`max-w-4xl mx-auto mb-6 ${cardColor} p-6 rounded-lg shadow-lg`}>
          <h2 className={`text-xl font-bold mb-4 ${textColor}`}>Bank Details</h2>
          <div className="grid grid-cols-3 gap-4">
            <input placeholder="Bank Name" value={bankName} onChange={(e) => setBankName(e.target.value)} className={`border p-2 rounded ${inputBg} ${textColor}`} />
            <input placeholder="Account Title" value={accountTitle} onChange={(e) => setAccountTitle(e.target.value)} className={`border p-2 rounded ${inputBg} ${textColor}`} />
            <input placeholder="Account Number / IBAN" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className={`border p-2 rounded ${inputBg} ${textColor}`} />
          </div>
        </div>
      )}

      <div ref={invoiceRef} className={`max-w-4xl mx-auto ${cardColor} p-8 rounded-lg shadow-lg`}>
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-center gap-4">
            {logo && <img src={logo} alt="Logo" className="h-16 w-16 object-contain" />}
            <div>
              <h1 className="text-3xl font-bold text-indigo-600">InvoicePak</h1>
              <p className={textSecondary}>By Shanza Hussain</p>
            </div>
          </div>
          <div className="text-right">
            <p className={textSecondary}>Invoice #:</p>
            {isPrinting? <p className={`font-bold text-lg ${textColor}`}>{invoiceNum}</p> : <input value={invoiceNum} onChange={(e) => setInvoiceNum(e.target.value)} className={`border p-1 rounded text-right font-bold mb-2 ${inputBg} ${textColor}`} />}
            <p className={`${textSecondary} mt-2`}>Date:</p>
            {isPrinting? <p className={`font-semibold ${textColor}`}>{invoiceDate}</p> : <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className={`border p-1 rounded text-right mb-2 ${inputBg} ${textColor}`} />}
            <p className={textSecondary}>Due Date:</p>
            {isPrinting? <p className={`font-semibold ${textColor}`}>{dueDate || 'N/A'}</p> : <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={`border p-1 rounded text-right ${inputBg} ${textColor}`} />}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <h2 className={`font-bold mb-2 ${textColor}`}>From:</h2>
            <p className={`font-semibold ${textColor}`}>Shanza Hussain</p>
            <p className={textSecondary}>Rafiqabad, Punjab, PK</p>
            <p className={textSecondary}>qashan866@gmail.com</p>
          </div>
          <div>
            <h2 className={`font-bold mb-2 ${textColor}`}>Bill To:</h2>
            {isPrinting? (
              <>
                <p className={`mb-2 font-semibold ${textColor}`}>{clientName || 'Client Name'}</p>
                <p className={textSecondary}>{clientEmail || 'client@email.com'}</p>
              </>
            ) : (
              <>
                {savedClients.length > 0 && (
                  <select onChange={loadClient} className={`border p-2 rounded w-full mb-2 ${inputBg} ${textColor}`}>
                    <option value="">Select Saved Client</option>
                    {savedClients.map((c, i) => <option key={i} value={c.email}>{c.name}</option>)}
                  </select>
                )}
                <input placeholder="Client Name" value={clientName} onChange={(e) => setClientName(e.target.value)} className={`border p-2 rounded w-full mb-2 ${inputBg} ${textColor}`} />
                <input placeholder="Client Email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} className={`border p-2 rounded w-full ${inputBg} ${textColor}`} />
              </>
            )}
          </div>
        </div>

        <table className="w-full mb-6">
          <thead>
            <tr className={darkMode? 'bg-gray-700' : 'bg-gray-200'}>
              <th className={`text-left p-3 ${textColor}`}>Item</th>
              <th className={`p-3 ${textColor}`}>Qty</th>
              <th className={`p-3 ${textColor}`}>Price (Rs.)</th>
              <th className={`p-3 ${textColor}`}>Total</th>
              {!isPrinting && <th className={`p-3 ${textColor}`}></th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className={`border-b ${darkMode? 'border-gray-700' : 'border-gray-300'}`}>
                <td className="p-2">
                  {isPrinting? <p className={textColor}>{item.name || 'Service Name'}</p> : <input placeholder="Service Name" value={item.name} onChange={(e) => updateItem(index, 'name', e.target.value)} className={`border p-2 rounded w-full ${inputBg} ${textColor}`} />}
                </td>
                <td className="p-2 text-center">
                  {isPrinting? <p className={textColor}>{item.qty}</p> : <input type="number" value={item.qty} onChange={(e) => updateItem(index, 'qty', Number(e.target.value))} className={`border p-2 rounded w-20 text-center ${inputBg} ${textColor}`} />}
                </td>
                <td className="p-2 text-center">
                  {isPrinting? <p className={textColor}>{item.price}</p> : <input type="number" value={item.price} onChange={(e) => updateItem(index, 'price', Number(e.target.value))} className={`border p-2 rounded w-24 text-center ${inputBg} ${textColor}`} />}
                </td>
                <td className={`p-2 text-center font-semibold ${textColor}`}>Rs. {(item.qty * item.price).toFixed(2)}</td>
                {!isPrinting && <td className="p-2"><button onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700">✕</button></td>}
              </tr>
            ))}
          </tbody>
        </table>

        {!isPrinting && <button onClick={addItem} className={`px-4 py-2 rounded mb-6 ${darkMode? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${textColor}`}>+ Add Item</button>}

        <div className="flex justify-between items-start mb-6">
          <div>
            {bankName && accountNumber && (
              <div>
                <h3 className={`font-bold mb-2 ${textColor}`}>Payment Details:</h3>
                <p className={textSecondary}>Bank: {bankName}</p>
                <p className={textSecondary}>Title: {accountTitle}</p>
                <p className={textSecondary}>A/C: {accountNumber}</p>
                <div className="mt-3">
                  <QRCodeSVG value={qrValue} size={100} bgColor={darkMode? '#1f2937' : '#ffffff'} fgColor={darkMode? '#ffffff' : '#000000'} />
                  <p className={`text-xs mt-1 ${textSecondary}`}>Scan to Pay</p>
                </div>
              </div>
            )}
          </div>
          <div className="w-80">
            <div className={`flex justify-between mb-2 ${textColor}`}><span>Subtotal:</span><span>Rs. {subtotal.toFixed(2)}</span></div>
            {!isPrinting && (
              <>
                <div className={`flex justify-between items-center mb-2 ${textColor}`}><span>Tax %:</span><input type="number" value={taxPercent} onChange={(e) => setTaxPercent(Number(e.target.value))} className={`border p-1 rounded w-20 text-right ${inputBg} ${textColor}`} /></div>
                <div className={`flex justify-between items-center mb-2 ${textColor}`}><span>Discount %:</span><input type="number" value={discountPercent} onChange={(e) => setDiscountPercent(Number(e.target.value))} className={`border p-1 rounded w-20 text-right ${inputBg} ${textColor}`} /></div>
              </>
            )}
            {isPrinting && taxPercent > 0 && <div className={`flex justify-between mb-2 ${textSecondary}`}><span>Tax ({taxPercent}%):</span><span>Rs. {taxAmount.toFixed(2)}</span></div>}
            {isPrinting && discountPercent > 0 && <div className={`flex justify-between mb-2 ${textSecondary}`}><span>Discount ({discountPercent}%):</span><span>- Rs. {discountAmount.toFixed(2)}</span></div>}
            <div className={`flex justify-between text-xl font-bold border-t pt-2 ${textColor} ${darkMode? 'border-gray-700' : 'border-gray-300'}`}><span>Total:</span><span>Rs. {total.toFixed(2)}</span></div>
          </div>
        </div>

        <div className={`border-t pt-4 flex justify-between items-end ${darkMode? 'border-gray-700' : 'border-gray-300'}`}>
          <div className="flex-1">
            <h3 className={`font-bold mb-2 ${textColor}`}>Notes:</h3>
            {isPrinting? <p className={textSecondary}>{notes}</p> : <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className={`border p-2 rounded w-full ${inputBg} ${textColor}`} rows="2" />}
            {!isPrinting && (
              <div className="mt-3">
                <label className={`block text-sm font-bold mb-1 ${textColor}`}>Upload Signature:</label>
                <input type="file" accept="image/*" onChange={handleSignatureUpload} className={`text-sm ${textColor}`} />
              </div>
            )}
          </div>
          {signature && <img src={signature} alt="Signature" className="h-20 object-contain ml-4" />}
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-6 flex gap-3 flex-wrap">
        <button onClick={saveInvoice} className="bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700">💾 Save Invoice</button>
        <button onClick={downloadPDF} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700">{isPrinting? 'Generating...' : '📄 Download PDF'}</button>
        <button onClick={clearForm} className="bg-gray-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-700">🗑️ Clear Form</button>
      </div>
    </div>
  );
}

export default App;