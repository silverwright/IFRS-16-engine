// src/pages/Home.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import {
  FileText,
  Calculator,
  BookOpen,
  Shield,
  BarChart3,
  GraduationCap,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export function Home() {
  const navigate = useNavigate();

  const text = "IFRS 16 Lease Solution";

  const modules = [
    {
      id: "/contract",
      title: "Contract Initiation & Approval",
      description:
        "Streamline lease contract creation and approval processes with comprehensive data capture and validation.",
      icon: FileText,
      features: [
        "Full lease contract management",
        "CSV import for existing contracts",
        "Approval workflows",
        "Data validation",
      ],
    },
    {
      id: "/calculations",
      title: "Lease Calculation Engine",
      description:
        "Advanced calculations for lease liability and right-of-use assets with automated amortization schedules.",
      icon: Calculator,
      features: [
        "Lease liability calculations",
        "Right-of-use asset valuation",
        "Amortization tables",
        "Total cost analysis",
      ],
    },
    {
      id: "/disclosure-journals",
      title: "Disclosure & Journal Entries",
      description:
        "Generate compliant disclosures and accounting journal entries automatically with maturity analysis.",
      icon: BookOpen,
      features: [
        "Automated journal entries",
        "Key disclosure figures",
        "Maturity analysis tables",
        "IFRS 16 compliance reporting",
      ],
    },
    {
      id: "/reports",
      title: "Reports & Analytics",
      description:
        "Comprehensive reporting and analytics for lease portfolio management.",
      icon: BookOpen,
      features: [
        "Portfolio analytics",
        "Custom report generation",
        "Period-end reporting",
        "Export capabilities",
      ],
    },
    {
      id: "/methodology",
      title: "IFRS 16 Methodology",
      description:
        "Comprehensive methodology guide covering assumptions, processes, and best practices.",
      icon: Shield,
      features: [
        "Methodology documentation",
        "Assumptions framework",
        "Best practices",
        "Implementation guides",
      ],
    },
    {
      id: "/dashboard",
      title: "Dashboard",
      description:
        "Comprehensive analytics and insights into your lease portfolio with interactive visualizations.",
      icon: BarChart3,
      features: [
        "Portfolio analytics",
        "Interactive dashboards",
        "Trend analysis",
        "Performance metrics",
      ],
    },
    {
      id: "/education",
      title: "Learn IFRS 16",
      description:
        "Self-paced e-learning platform to master IFRS 16 lease accounting fundamentals.",
      icon: GraduationCap,
      features: [
        "Interactive courses",
        "Self-assessment tools",
        "Progress tracking",
        "Certification",
      ],
    },
  ];

  return (
    <div className="w-full font-sans">
      {/* Hero Section */}
      <section className="relative w-screen min-h-screen flex flex-col items-center justify-center text-center bg-cover bg-center -mt-16 md:-mt-20">
        <img
          src="/Picture1.png"
          alt="Landing Background"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Content */}
        <div className="relative z-10 px-4">
          {/* Word-by-word staggered animation */}
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6 flex flex-wrap justify-center">
            {text.split(" ").map((word, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.9 + index * 0.6,
                  duration: 0.6,
                }}
                className="mr-2"
              >
                {word}
              </motion.span>
            ))}
          </h1>

          {/* Benefits Typing Animation */}
          <div className="flex flex-wrap justify-center gap-3 text-white text-xl md:text-2xl font-bold mt-4">
            <TypeAnimation
              sequence={[
                4000,
                "✅ IFRS 16 Compliant",
                2000,
                "⚡ Automated Calculations",
                2000,
                "👥 Multi-User Support",
                2000,
                "🌍 Multi-Currency",
                2000,
                "IFRS 16 Compliant | Automated Calculations | Multi-User Support | Multi-Currency",
              ]}
              speed={50}
              repeat={0}
              wrapper="span"
              cursor={false}
              className="whitespace-pre inline-block min-h-[40px]"
            />
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <section className="px-6 py-12 bg-slate-50 dark:bg-gray-900 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <motion.div
                key={module.id}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-slate-200 dark:border-gray-700 p-6 hover:shadow-lg dark:hover:shadow-2xl transition-all duration-300 group cursor-pointer"
                onClick={() => navigate(module.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-800 transition-colors">
                    <Icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Module {index + 1}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                  {module.title}
                </h3>

                <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 leading-relaxed">
                  {module.description}
                </p>

                <ul className="space-y-2 mb-6">
                  {module.features.map((feature, featureIndex) => (
                    <li
                      key={featureIndex}
                      className="flex items-center text-sm text-slate-600 dark:text-slate-400"
                    >
                      <CheckCircle className="h-4 w-4 text-emerald-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium text-sm group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
                  Access Module
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Call to Action */}
      <section className="px-6 mt-16 mb-12 w-full">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-4">
            Ready to Streamline Your Lease Accounting?
          </h2>
          <p className="text-blue-100 dark:text-blue-200 mb-6 max-w-2xl mx-auto">
            Start with Module 1 to initiate your first lease contract, or
            explore our methodology guide to understand the framework.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button
              onClick={() => navigate("/contract")}
              className="bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors"
            >
              Start with Contract Initiation
            </button>
            <button
              onClick={() => navigate("/methodology")}
              className="border border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white hover:text-blue-600 dark:hover:bg-gray-800 dark:hover:text-blue-400 transition-colors"
            >
              View Methodology
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
