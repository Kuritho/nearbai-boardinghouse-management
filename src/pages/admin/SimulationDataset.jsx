import { useEffect, useState } from 'react';
import { Download, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { simulationData } from '../../services/localDB';
import { exportSimulationDataset } from '../../services/exportService';

export default function SimulationDataset() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(simulationData.get());
  }, []);

  if (!data) return <div className="p-8 text-center">Loading dataset...</div>;

  // Reusable Table Component matching the image style
  const DataTable = ({ title, icon, headers, rows, keys }) => (
    <div className="bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden flex flex-col">
      <div className="bg-[#4c1d95] text-white px-4 py-2.5 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <h3 className="font-bold text-sm tracking-wide">{title}</h3>
      </div>
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-xs text-left">
          <thead className="bg-[#ede9fe] text-[#4c1d95]">
            <tr>
              {headers.map((h, i) => (
                <th key={i} className="px-3 py-2 font-bold border-b border-purple-200 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-purple-100">
            {rows.map((row, i) => {
              const isTotal = row[keys[0]] === 'Total' || row[keys[0]] === 'Total Expenses';
              return (
                <tr key={i} className={isTotal ? 'bg-[#f3e8ff] font-bold text-[#4c1d95]' : 'hover:bg-slate-50'}>
                  {keys.map((k, j) => (
                    <td key={j} className={`px-3 py-2 ${isTotal ? '' : 'text-slate-700'}`}>{row[k]}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="pb-10 bg-[#fafaf9] min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin')} className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Simulation Dataset</h1>
            <p className="text-sm text-slate-500">Boarding House Management · Generated from Live Data</p>
          </div>
        </div>
        <button onClick={exportSimulationDataset} className="btn-primary !px-4 !py-2.5 text-sm">
          <Download size={16} className="mr-2" /> Download Excel
        </button>
      </div>

      {/* Grid Layout matching the image */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        
        {/* Row 1 */}
        <DataTable 
          title="A. Room Configuration" icon="🛏️"
          headers={['Room', 'Type', 'Beds', 'Rent (mo)', 'Rent/Bed']}
          rows={data.tableA} keys={['room', 'type', 'beds', 'roomRent', 'rentPerBed']}
        />
        <DataTable 
          title="B. Occupancy Data" icon="👥"
          headers={['Room', 'Occupied', 'Vacant', 'Occupancy']}
          rows={data.tableB} keys={['room', 'occupied', 'vacant', 'occupancy']}
        />
        <DataTable 
          title="C. Rent Payment Summary" icon="📅"
          headers={['Room', 'Billed', 'Collected', 'Unpaid']}
          rows={data.tableC} keys={['room', 'billed', 'collected', 'unpaid']}
        />

        {/* Row 2 */}
        <DataTable 
          title="D. Overdue Tenants" icon="👤"
          headers={['Tenant', 'Room', 'Rent Due', 'Paid', 'Overdue']}
          rows={data.tableD} keys={['tenant', 'room', 'rentDue', 'paid', 'overdue']}
        />
        <DataTable 
          title="E. Utility Charges" icon="⚡"
          headers={['Room', 'Tenants', 'Elec.', 'Water', 'Total']}
          rows={data.tableE} keys={['room', 'tenants', 'elec', 'water', 'total']}
        />
        <DataTable 
          title="F. Operating Expenses" icon="🧾"
          headers={['Expense', 'Amount']}
          rows={data.tableF} keys={['expense', 'amount']}
        />

        {/* Row 3 */}
        <DataTable 
          title="G. Inquiry Summary" icon="📊"
          headers={['Pref', 'Inquiries', 'Qualified', 'Avail', 'Gap']}
          rows={data.tableG} keys={['pref', 'inq', 'qual', 'avail', 'gap']}
        />
        
        {/* Table H with Fake Mini Chart to match the visual */}
        <div className="bg-white rounded-xl border border-purple-200 shadow-sm overflow-hidden flex flex-col">
          <div className="bg-[#4c1d95] text-white px-4 py-2.5 flex items-center gap-2">
            <span className="text-lg">📈</span>
            <h3 className="font-bold text-sm tracking-wide">H. Weekly Inquiry Trend</h3>
          </div>
          <div className="p-4 flex-1 flex gap-4">
            <div className="w-1/2 overflow-x-auto">
               <table className="w-full text-xs text-left">
                <thead className="bg-[#ede9fe] text-[#4c1d95]">
                  <tr>
                    <th className="px-2 py-1.5 font-bold border-b border-purple-200">Week</th>
                    <th className="px-2 py-1.5 font-bold border-b border-purple-200 text-right">Inq</th>
                    <th className="px-2 py-1.5 font-bold border-b border-purple-200 text-right">Qual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-100">
                  {data.tableH.map((r, i) => (
                    <tr key={i} className={r.week === 'Total' ? 'bg-[#f3e8ff] font-bold text-[#4c1d95]' : ''}>
                      <td className="px-2 py-1.5 truncate max-w-[80px]">{r.week.split('(')[0]}</td>
                      <td className="px-2 py-1.5 text-right">{r.total}</td>
                      <td className="px-2 py-1.5 text-right">{r.qualified}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Fake Chart Visualization */}
            <div className="w-1/2 flex items-end justify-between pb-4 pt-2 relative border-l border-b border-slate-200">
               <div className="absolute top-0 right-0 text-[8px] flex flex-col gap-1 text-slate-400">
                 <span>12 -</span><span>8 -</span><span>4 -</span><span>0 -</span>
               </div>
               {data.tableH.slice(0, 4).map((w, i) => {
                 const maxTotal = Math.max(...data.tableH.map(x => x.total), 1);
                 const hTotal = (w.total / maxTotal) * 100;
                 const hQual = (w.qualified / maxTotal) * 100;
                 return (
                   <div key={i} className="flex-1 flex flex-col items-center gap-1 z-10">
                     <div className="w-full flex justify-center gap-1 items-end h-16">
                        <div className="w-2 bg-indigo-500 rounded-t-sm" style={{ height: `${hTotal}%` }} />
                        <div className="w-2 bg-purple-300 rounded-t-sm" style={{ height: `${hQual}%` }} />
                     </div>
                     <span className="text-[9px] font-bold text-slate-500">W{i+1}</span>
                   </div>
                 );
               })}
            </div>
          </div>
        </div>

        <DataTable 
          title="I. Key Results" icon="📋"
          headers={['Metric', 'Value']}
          rows={data.tableI} keys={['metric', 'value']}
        />
      </div>
    </div>
  );
}