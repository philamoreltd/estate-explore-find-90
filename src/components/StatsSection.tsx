const StatsSection = () => {
  const stats = [
    {
      number: "50K+",
      label: "Properties Listed",
      description: "Active listings across the region"
    },
    {
      number: "25K+",
      label: "Happy Customers",
      description: "Successful transactions completed"
    },
    {
      number: "500+",
      label: "Expert Agents",
      description: "Professional real estate agents"
    },
    {
      number: "99%",
      label: "Success Rate",
      description: "Customer satisfaction rating"
    }
  ];

  return (
    <section className="py-16 bg-real-estate-navy">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                {stat.number}
              </div>
              <div className="text-lg font-semibold text-real-estate-gold mb-1">
                {stat.label}
              </div>
              <div className="text-sm text-white/80">
                {stat.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;