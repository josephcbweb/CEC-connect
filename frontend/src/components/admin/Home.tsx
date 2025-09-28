const Home = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
      <p className="mt-2 text-[#3AA9AB] text-2xl font-semibold">Welcome!</p>

      <div className="mt-8 p-6 bg-gray-100 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold">Your Content Area</h2>
        <p className="mt-2">
          This is where the main content for each page will be displayed. The
          sidebar will remain fixed on the left.
        </p>
      </div>
    </div>
  );
};

export default Home;
