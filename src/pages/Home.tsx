import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Play,
} from "lucide-react";

export function Home() {
  const navigate = useNavigate();

  const modules = [
    {
      id: "/contract",
      title: "Contract Initiation & Approval",
      description:
        "Streamline lease contract creation and approval processes with comprehensive data capture and validation.",
      image: "https://images.pexels.com/photos/48148/document-agreement-documents-sign-48148.jpeg?auto=compress&cs=tinysrgb&w=800",
      color: "from-blue-600 to-blue-700"
    },
    {
      id: "/calculations",
      title: "Lease Calculation Engine",
      description:
        "Advanced calculations for lease liability and right-of-use assets with automated amortization schedules.",
      image: "https://images.pexels.com/photos/6801647/pexels-photo-6801647.jpeg?auto=compress&cs=tinysrgb&w=800",
      color: "from-emerald-600 to-emerald-700"
    },
    {
      id: "/disclosure-journals",
      title: "Disclosure & Journal Entries",
      description:
        "Generate compliant disclosures and accounting journal entries automatically with maturity analysis.",
      image: "https://images.pexels.com/photos/534216/pexels-photo-534216.jpeg?auto=compress&cs=tinysrgb&w=800",
      color: "from-violet-600 to-violet-700"
    },
    {
      id: "/reports",
      title: "Reports & Analytics",
      description:
        "Comprehensive reporting and analytics for lease portfolio management.",
      image: "https://images.pexels.com/photos/590022/pexels-photo-590022.jpeg?auto=compress&cs=tinysrgb&w=800",
      color: "from-amber-600 to-amber-700"
    },
    {
      id: "/methodology",
      title: "IFRS 16 Methodology",
      description:
        "Comprehensive methodology guide covering assumptions, processes, and best practices.",
      image: "https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg?auto=compress&cs=tinysrgb&w=800",
      color: "from-cyan-600 to-cyan-700"
    },
    {
      id: "/dashboard",
      title: "Dashboard",
      description:
        "Comprehensive analytics and insights into your lease portfolio with interactive visualizations.",
      image: "https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=800",
      color: "from-pink-600 to-pink-700"
    },
    {
      id: "/education",
      title: "Learn IFRS 16",
      description:
        "Self-paced e-learning platform to master IFRS 16 lease accounting fundamentals.",
      image: "https://images.pexels.com/photos/6238050/pexels-photo-6238050.jpeg?auto=compress&cs=tinysrgb&w=800",
      color: "from-indigo-600 to-indigo-700"
    },
  ];

  return (
    <div className="w-full font-sans bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 min-h-screen">
      {/* Hero Section */}
      <section className="relative w-full h-screen flex items-center -mt-16 md:-mt-20 overflow-hidden">
        {/* Full-width Background Image */}
        <div className="absolute inset-0 w-full h-full">
          <img
            src="https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=1920"
            alt="Professional working"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Slanted Overlay from Left */}
        <div className="absolute inset-0 w-full h-full">
          <div
            className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
            style={{
              clipPath: 'polygon(0 0, 68% 0, 52% 100%, 0 100%)'
            }}
          ></div>
        </div>

        {/* Content Container */}
        <div className="container mx-auto px-6 lg:px-12 relative z-10">
          <div className="max-w-2xl">
            {/* Left Content */}
            <div className="space-y-8">
              <div className="inline-block">
                <span className="text-emerald-400 text-sm font-semibold tracking-wider uppercase">
                  Financial Excellence
                </span>
              </div>

              <h1 className="text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight">
                IFRS 16 Lease
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                  Solution
                </span>
              </h1>

              <div className="space-y-4 text-slate-300 text-lg leading-relaxed">
                <p>
                  IFRS 16 is the international accounting standard for lease accounting that requires organizations to recognize most leases on their balance sheet as right-of-use assets and corresponding lease liabilities.
                </p>
                <p>
                  This comprehensive solution streamlines the complex process of lease accounting by automating calculations, generating compliant disclosures, and producing accurate journal entries that meet IFRS 16 requirements.
                </p>
                <p className="text-white font-medium">
                  From contract initiation to financial reporting, our platform handles the entire lease lifecycle, ensuring accurate measurement of lease liabilities and right-of-use assets while maintaining full compliance with international accounting standards.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <button
                  onClick={() => navigate("/contract")}
                  className="group bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg shadow-emerald-500/50"
                >
                  Learn More
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button
                  onClick={() => navigate("/education")}
                  className="group bg-slate-700 hover:bg-slate-600 text-white px-8 py-4 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
                >
                  Watch Demo
                  <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section className="py-20 px-6 lg:px-12 relative">
        <div className="container mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 space-y-4">
            <span className="text-emerald-400 text-sm font-semibold tracking-wider uppercase">
              Our Modules
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold text-white">
              Complete IFRS 16 Platform
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              End-to-end lease accounting solution from contract initiation to financial reporting
            </p>
          </div>

          {/* Modules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {modules.map((module, index) => (
              <div
                key={module.id}
                className="group relative bg-slate-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-slate-700 hover:border-emerald-500/50 transition-all duration-300 cursor-pointer"
                onClick={() => navigate(module.id)}
              >
                {/* Module Image */}
                <div className="relative h-64 overflow-hidden">
                  <img
                    src={module.image}
                    alt={module.title}
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent"></div>

                  {/* Module Number Badge */}
                  <div className="absolute top-4 right-4 w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    {index + 1}
                  </div>
                </div>

                {/* Module Content */}
                <div className="p-6 space-y-3">
                  <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors">
                    {module.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {module.description}
                  </p>

                  {/* CTA */}
                  <div className="pt-4">
                    <button className="w-full bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white py-3 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 group/btn">
                      <span>Open Solution</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>

                {/* Hover Glow Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                  <div className={`absolute inset-0 bg-gradient-to-t ${module.color} opacity-10`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 lg:px-12 relative">
        <div className="container mx-auto">
          <div className="relative bg-gradient-to-r from-emerald-600 to-cyan-600 rounded-3xl overflow-hidden shadow-2xl">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute inset-0" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                backgroundSize: '30px 30px'
              }}></div>
            </div>

            <div className="relative z-10 py-16 px-8 lg:px-16 text-center space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold text-white">
                Ready to Streamline Your Lease Accounting?
              </h2>
              <p className="text-white/90 text-lg max-w-2xl mx-auto">
                Start with Module 1 to initiate your first lease contract, or explore our methodology guide to understand the framework.
              </p>
              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <button
                  onClick={() => navigate("/contract")}
                  className="bg-white text-emerald-600 px-8 py-4 rounded-lg font-semibold hover:bg-slate-100 transition-colors shadow-lg"
                >
                  Start with Contract Initiation
                </button>
                <button
                  onClick={() => navigate("/methodology")}
                  className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-emerald-600 transition-all"
                >
                  View Methodology
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
