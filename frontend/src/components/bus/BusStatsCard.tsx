const BusStatsCard = ({ icon, label, value, subValue }: { icon: React.ReactNode, label: string, value: string, subValue?: string }) => (
  <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-start gap-4">
    <div className="p-3 bg-gray-50 rounded-lg">{icon}</div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-800">{value}</p>
      {subValue && <p className="text-sm text-gray-700 font-mono">{subValue}</p>}
    </div>
  </div>
);
export default BusStatsCard;