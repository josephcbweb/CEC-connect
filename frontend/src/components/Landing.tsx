import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Logo from "../assets/logo.png";
import axios from "axios";

const API_URL = "http://localhost:3000";

interface SectionRefs {
  [key: string]: HTMLDivElement | null;
}

interface LandingStats {
  students: number;
  faculty: number;
  departments: number;
}

interface Department {
  id: number;
  name: string;
  department_code: string;
  program: string;
  _count: {
    students: number;
  };
}

export const Landing: React.FC = () => {
  const sectionRefs = useRef<SectionRefs>({});
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/departments`);
        setDepartments(response.data);
      } catch (error) {
        console.error("Error fetching departments:", error);
      }
    };

    fetchDepartments();
  }, []);

  const getDepartmentColor = (code: string) => {
    const colors: { [key: string]: string } = {
      CSE: "bg-blue-500",
      ECE: "bg-teal-500",
      EEE: "bg-purple-500",
      AD: "bg-pink-500",
    };
    return colors[code] || "bg-gray-500";
  };
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [stats, setStats] = useState<LandingStats>({
    students: 2000,
    faculty: 150,
    departments: 4,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_URL}/stats`);
        setStats(response.data);
      } catch (error) {
        console.error("Failed to fetch landing stats:", error);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    // Intersection Observer for centered scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px",
      },
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      observer.disconnect();
    };
  }, [departments, stats]);

  useEffect(() => {
    // Enhanced animated background
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const particles: Particle[] = [];
    const particleCount = 80;

    class Particle {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      color: string;
      alpha: number;

      constructor() {
        this.x = Math.random() * (canvas?.width ?? 0);
        this.y = Math.random() * (canvas?.height ?? 0);
        this.size = Math.random() * 3 + 1;
        this.speedX = Math.random() * 0.8 - 0.4;
        this.speedY = Math.random() * 0.8 - 0.4;
        this.color = `hsla(${180 + Math.random() * 60}, 70%, 60%, ${
          Math.random() * 0.2 + 0.05
        })`;
        this.alpha = Math.random() * 0.1 + 0.05;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (canvas) {
          if (this.x > canvas.width) this.x = 0;
          if (this.x < 0) this.x = canvas.width;
          if (this.y > canvas.height) this.y = 0;
          if (this.y < 0) this.y = canvas.height;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();

        // Add glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const connectParticles = () => {
      const maxDistance = 150;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            ctx.beginPath();
            ctx.strokeStyle = `hsla(180, 70%, 60%, ${
              0.1 * (1 - distance / maxDistance)
            })`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.shadowBlur = 0;

      particles.forEach((particle) => {
        particle.update();
        particle.draw();
      });

      connectParticles();
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const addToRefs = (el: HTMLDivElement | null, key: string) => {
    if (el) {
      sectionRefs.current[key] = el;
    }
  };

  const scrollToSection = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  const navItems = [
    { id: "home", label: "Home" },
    { id: "about", label: "About" },
    { id: "academics", label: "Academics" },
    { id: "research", label: "Research" },
    { id: "contact", label: "Contact" },
  ];

  const groupedDepartments = React.useMemo(() => {
    const groups: { [key: string]: Department[] } = {};
    departments.forEach((dept) => {
      // Keep all departments regardless of student count to match screenshot
      const program = dept.program || "Others";
      if (!groups[program]) {
        groups[program] = [];
      }
      groups[program].push(dept);
    });

    return groups;
  }, [departments]);

  const availablePrograms = Object.keys(groupedDepartments);

  useEffect(() => {
    if (availablePrograms.length > 0 && !expandedProgram) {
      setExpandedProgram(availablePrograms[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availablePrograms]);

  const toggleProgram = (program: string) => {
    setExpandedProgram(program);
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <canvas
        ref={canvasRef}
        className="fixed inset-0 pointer-events-none z-0"
        style={{ opacity: 0.4 }}
      />

      {/* Gradient Overlays */}
      <div className="fixed inset-0 pointer-events-none z-1">
        <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-blue-50/30 to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-gray-50/30 to-transparent"></div>
      </div>

      {/* Enhanced Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-lg border-b border-gray-200/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="relative">
                <img
                  src={Logo}
                  alt="Acads Logo"
                  className="h-10 w-10 transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-blue-500/10 rounded-full group-hover:bg-blue-500/20 transition-colors duration-300"></div>
              </div>
              <span className="text-2xl font-light text-gray-900 group-hover:text-blue-600 transition-colors duration-300">
                Acads
              </span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-10 absolute mx-auto w-full justify-center">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="text-gray-700 hover:text-blue-600 transition-all duration-300 font-light text-sm relative group"
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              {/* Student Login Button */}
              <Link
                to="/studentlogin"
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-teal-600 text-white text-sm font-light rounded-full hover:from-blue-700 hover:to-teal-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-blue-500/25"
              >
                STUDENT LOGIN
              </Link>

              {/* Admin Login Button */}
              <Link
                to="/signup"
                className="px-6 py-2.5 border border-blue-600 text-blue-600 text-sm font-light rounded-full hover:bg-blue-600 hover:text-white transition-all duration-300 transform hover:scale-105"
              >
                ADMIN LOGIN
              </Link>

              {/* Mobile Menu Button */}
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors duration-300"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <div className="w-6 h-6 flex flex-col justify-center space-y-1">
                  <span
                    className={`w-full h-0.5 bg-gray-700 transition-all duration-300 ${
                      isMenuOpen ? "rotate-45 translate-y-2" : ""
                    }`}
                  ></span>
                  <span
                    className={`w-full h-0.5 bg-gray-700 transition-all duration-300 ${
                      isMenuOpen ? "opacity-0" : "opacity-100"
                    }`}
                  ></span>
                  <span
                    className={`w-full h-0.5 bg-gray-700 transition-all duration-300 ${
                      isMenuOpen ? "-rotate-45 -translate-y-2" : ""
                    }`}
                  ></span>
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <div
            className={`lg:hidden overflow-hidden transition-all duration-500 ease-in-out ${
              isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="py-4 space-y-4 border-t border-gray-200 mt-4">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className="block text-gray-700 hover:text-blue-600 transition-colors duration-300 font-light text-sm py-2 w-full text-left"
                >
                  {item.label}
                </button>
              ))}
              <div className="pt-4 border-t border-gray-200 space-y-3">
                <Link
                  to="/student-login"
                  className="block w-full text-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-teal-600 text-white text-sm font-light rounded-full hover:from-blue-700 hover:to-teal-700 transition-all duration-300"
                >
                  STUDENT LOGIN
                </Link>
                <Link
                  to="/admin-login"
                  className="block w-full text-center px-4 py-2.5 border border-blue-600 text-blue-600 text-sm font-light rounded-full hover:bg-blue-600 hover:text-white transition-all duration-300"
                >
                  ADMIN LOGIN
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Enhanced Hero Section */}
      <section
        id="home"
        className="min-h-screen flex items-center justify-center pt-20 relative z-10 cursor-pointer"
      >
        <div className="container mx-auto px-6 ">
          <div className="max-w-6xl mx-auto text-center ">
            <div
              ref={(el) => addToRefs(el, "hero")}
              className="opacity-0 translate-y-8 transition-all duration-1000 ease-out "
            >
              {/* Animated Logo */}
              <div className="flex justify-center mb-12">
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full blur-lg opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                  <img
                    src={Logo}
                    alt="Acads Logo"
                    className="h-32 w-32 relative z-10 transform transition duration-700 group-hover:scale-110 group-hover:rotate-6"
                  />
                </div>
              </div>

              {/* Main Heading */}
              <h1 className="text-6xl md:text-8xl lg:text-9xl font-light bg-gradient-to-br from-gray-900 via-blue-600 to-teal-600 bg-clip-text text-transparent mb-8 leading-tight">
                Acads
              </h1>

              {/* Subtitle */}
              <p className="text-2xl md:text-3xl text-gray-600 mb-16 max-w-4xl mx-auto leading-relaxed font-light">
                Redefining academic excellence through{" "}
                <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent font-normal">
                  innovative technology
                </span>{" "}
                and collaborative learning environments.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <button
                  onClick={() => scrollToSection("about")}
                  className="group px-12 py-5 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-2xl hover:from-blue-700 hover:to-teal-700 transition-all duration-500 text-lg font-light shadow-2xl hover:shadow-blue-500/30 transform hover:scale-105"
                >
                  <span className="flex items-center">
                    Explore Platform
                    <span className="ml-4 group-hover:translate-x-2 transition-transform duration-300 text-xl">
                      →
                    </span>
                  </span>
                </button>
              </div>

              {/* Scroll Indicator */}
              <div className="mt-24 animate-bounce w-full flex justify-center">
                <div className="w-6 h-10 border-2 border-gray-400 rounded-full flex justify-center">
                  <div className="w-1 h-3 bg-gray-400 rounded-full mt-2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Stats Section */}
      <section id="about" className="py-24 relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-5xl mx-auto">
            {[
              {
                number: `${stats.students}+`,
                label: "Students",
                color: "from-blue-500 to-blue-600",
              },
              {
                number: `${stats.faculty}+`,
                label: "Faculty",
                color: "from-teal-500 to-teal-600",
              },
              {
                number: `${stats.departments}`,
                label: "Departments",
                color: "from-purple-500 to-purple-600",
              },
              {
                number: "99%",
                label: "Satisfaction",
                color: "from-green-500 to-green-600",
              },
            ].map((stat, index) => (
              <div
                key={stat.label}
                ref={(el) => addToRefs(el, `stat-${index}`)}
                className="opacity-0 translate-y-8 transition-all duration-700 ease-out text-center group"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className="relative p-8 rounded-3xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-2">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${stat.color} rounded-3xl opacity-5 group-hover:opacity-10 transition-opacity duration-500`}
                  ></div>
                  <div className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                    {stat.number}
                  </div>
                  <div className="text-gray-600 font-light text-lg">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-32 relative z-10">
        <div className="container mx-auto px-6">
          <div
            ref={(el) => addToRefs(el, "features-header")}
            className="opacity-0 translate-y-8 transition-all duration-700 ease-out text-center mb-24"
          >
            <h2 className="text-5xl md:text-6xl font-light text-gray-900 mb-8">
              Academic Excellence,
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                Perfected
              </span>
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto text-xl font-light leading-relaxed">
              Experience the future of education management with our
              comprehensive suite of tools designed for modern academic
              institutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {[
              {
                title: "Seamless Collaboration",
                description:
                  "Connect students, faculty, and staff in a unified academic environment designed for modern education.",
                icon: "🤝",
                gradient: "from-blue-500 to-cyan-500",
              },
              {
                title: "Advanced Analytics",
                description:
                  "Make data-driven decisions with comprehensive insights into academic performance and institutional metrics.",
                icon: "📊",
                gradient: "from-purple-500 to-pink-500",
              },
              {
                title: "Smart Automation",
                description:
                  "Streamline administrative tasks and focus on what matters most—education and research.",
                icon: "⚡",
                gradient: "from-orange-500 to-red-500",
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                ref={(el) => addToRefs(el, `feature-${index}`)}
                className="opacity-0 translate-y-8 transition-all duration-700 ease-out group"
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <div className="relative p-8 rounded-3xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 group-hover:-translate-y-4 h-full">
                  {/* Gradient Background Effect */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} rounded-3xl opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                  ></div>

                  {/* Icon */}
                  <div className="text-5xl mb-6 transform group-hover:scale-110 transition-transform duration-500">
                    {feature.icon}
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4 group-hover:text-gray-800 transition-colors duration-300">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed font-light text-lg">
                    {feature.description}
                  </p>

                  {/* Animated Border */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 group-hover:w-3/4 h-0.5 bg-gradient-to-r from-blue-500 to-teal-500 transition-all duration-500 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Academic Programs */}
      <section
        id="academics"
        className="py-32 bg-gradient-to-br from-gray-50 to-blue-50/30 relative z-10"
      >
        <div className="container mx-auto px-6">
          <div
            ref={(el) => addToRefs(el, "programs-header")}
            className="opacity-0 translate-y-8 transition-all duration-700 ease-out text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-light text-gray-900 mb-6">
              Our{" "}
              <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                Programs
              </span>
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-xl font-light">
              Discover our comprehensive range of academic programs designed to
              shape future leaders.
            </p>
          </div>

          <div className="max-w-5xl mx-auto space-y-6">
            {availablePrograms.length === 0 ? (
              <div className="text-center text-gray-500 py-10 opacity-0 translate-y-8 animate-in">
                No active programs found.
              </div>
            ) : (
              <div className="flex flex-col space-y-4">
                {/* Program Cards/Buttons Row */}
                <div className="flex flex-wrap justify-center gap-4 mb-8">
                  {availablePrograms.map((program) => {
                    const totalStudents = groupedDepartments[program].reduce(
                      (acc, dept) => acc + (dept._count?.students || 0),
                      0,
                    );
                    return (
                      <button
                        key={program}
                        onClick={() => toggleProgram(program)}
                        className={`px-6 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 shadow-md flex items-center space-x-3 ${
                          expandedProgram === program
                            ? "bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-blue-500/30"
                            : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
                        }`}
                      >
                        <span>{program} Program</span>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            expandedProgram === program
                              ? "bg-white/20 text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {totalStudents}{" "}
                          {totalStudents === 1 ? "Student" : "Students"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Expanded Departments List */}
                {expandedProgram && groupedDepartments[expandedProgram] && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    {groupedDepartments[expandedProgram].map((dept) => (
                      <div
                        key={dept.id}
                        className="relative p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-gray-200/50 shadow-md hover:shadow-lg transition-all duration-300 group hover:-translate-y-1 hover:border-blue-200/50"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                          <div className="flex items-center space-x-5">
                            <div
                              className={`w-3 h-12 ${getDepartmentColor(
                                dept.department_code,
                              )} rounded-full transform group-hover:scale-110 transition-transform duration-300`}
                            ></div>
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-700 transition-colors duration-300 mb-1">
                                {dept.name}
                              </h3>
                              <p className="text-gray-500 text-sm font-light">
                                {dept.department_code} Department
                              </p>
                            </div>
                          </div>
                          <div className="mt-4 sm:mt-0 flex items-center bg-gray-50 px-4 py-2 rounded-full shadow-inner">
                            <span className="text-gray-700 font-medium whitespace-nowrap">
                              {dept._count.students} Students Enrolled
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Enhanced Research Section */}
      <section id="research" className="py-32 relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center max-w-7xl mx-auto">
            <div
              ref={(el) => addToRefs(el, "research-content")}
              className="opacity-0 translate-y-8 transition-all duration-700 ease-out"
            >
              <h2 className="text-5xl md:text-6xl font-light text-gray-900 mb-8">
                Pioneering{" "}
                <span className="bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
                  Research
                </span>
              </h2>
              <p className="text-gray-600 text-xl leading-relaxed mb-12 font-light">
                Our platform supports groundbreaking research across multiple
                disciplines, providing cutting-edge tools for collaboration,
                data analysis, and publication management.
              </p>
              <div className="space-y-6">
                {[
                  "Advanced research analytics and visualization",
                  "Collaborative workspace tools",
                  "Publication management system",
                  "Grant tracking and management",
                ].map((item) => (
                  <div key={item} className="flex items-center space-x-4 group">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-teal-500 flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                    <span className="text-gray-800 text-lg font-light group-hover:text-gray-900 transition-colors duration-300">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div
              ref={(el) => addToRefs(el, "research-visual")}
              className="opacity-0 translate-y-8 transition-all duration-700 ease-out"
            >
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-teal-500 to-purple-600 rounded-3xl transform rotate-3 scale-105 opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
                <div className="relative bg-gradient-to-br from-gray-900 to-blue-900 rounded-3xl p-12 aspect-video flex items-center justify-center shadow-2xl transform group-hover:-translate-y-2 transition-transform duration-500">
                  <div className="text-center text-white">
                    <div className="text-7xl mb-8 transform group-hover:scale-110 transition-transform duration-500">
                      🔬
                    </div>
                    <p className="text-2xl font-light mb-4">
                      Research Excellence Platform
                    </p>
                    <p className="text-blue-200 font-light">
                      Empowering discoveries that shape our future
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section id="contact" className="py-32 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-blue-900 to-teal-900"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 to-transparent"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div
            ref={(el) => addToRefs(el, "cta")}
            className="opacity-0 translate-y-8 transition-all duration-700 ease-out text-center max-w-5xl mx-auto"
          >
            <h2 className="text-5xl md:text-6xl font-light text-white mb-8">
              Ready to Transform Your{" "}
              <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                Academic
              </span>{" "}
              Journey?
            </h2>
            <p className="text-blue-100 text-xl md:text-2xl mb-16 max-w-3xl mx-auto font-light leading-relaxed">
              Join our community of innovators, researchers, and educators
              shaping the future of education through technology and
              collaboration.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Link
                to="/student-login"
                className="group px-14 py-5 bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-2xl hover:from-blue-600 hover:to-teal-600 transition-all duration-500 text-lg font-semibold shadow-2xl hover:shadow-blue-500/40 transform hover:scale-105"
              >
                <span className="flex items-center">
                  Student Portal
                  <span className="ml-4 group-hover:translate-x-2 transition-transform duration-300 text-xl">
                    →
                  </span>
                </span>
              </Link>
              <Link
                to="/admin-login"
                className="px-14 py-5 border-2 border-white/30 text-white rounded-2xl hover:bg-white hover:text-gray-900 transition-all duration-500 text-lg font-light backdrop-blur-sm transform hover:scale-105"
              >
                Admin Portal
              </Link>
            </div>

            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-white/60 text-sm">
              {[
                "24/7 Support",
                "Secure Platform",
                "Global Community",
                "Proven Results",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-center space-x-2"
                >
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="py-20 bg-gradient-to-b from-white to-gray-50 border-t border-gray-200/50 relative z-10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Brand Column */}
            <div className="flex flex-col items-center">
              <div className="flex items-center space-x-4 mb-8">
                <div className="relative">
                  <img src={Logo} alt="Acads Logo" className="h-12 w-12" />
                  <div className="absolute inset-0 bg-blue-500/10 rounded-full animate-pulse"></div>
                </div>
                <span className="text-2xl font-light text-gray-900">Acads</span>
              </div>
              <p className="text-gray-600 text-lg font-light leading-relaxed max-w-md text-center">
                Empowering the next generation of thinkers, innovators, and
                leaders through cutting-edge technology and transformative
                education.
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200/50 mt-16 pt-8 text-center">
            <p className="text-gray-500 font-light">
              © 2024 Acads. All rights reserved.{" "}
              <span className="text-blue-500">
                Building the future of education.
              </span>
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        .animate-in {
          opacity: 1;
          transform: translateY(0);
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #06b6d4);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #0891b2);
        }
      `}</style>
    </div>
  );
};
