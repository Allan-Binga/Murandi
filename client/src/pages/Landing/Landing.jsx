import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { endpoint } from "../../apiEndpoint";
import { Bath, Maximize } from "lucide-react";
import { Link } from "react-router-dom";
import Spinner from "../../components/Spinner";

function LandingPage() {
  const [listings, setListings] = useState([]);

  useEffect(() => {
    const fetchListings = async () => {
      try {
        const response = await axios.get(`${endpoint}/listings/all-listings`);
        const normalizedListings = response.data.map((apt) => {
          const isStudio = apt.title?.toLowerCase().includes("studio");
          return {
            ...apt,
            beds: isStudio ? "studio" : apt.beds,
          };
        });
        setListings(normalizedListings);
      } catch (error) {
        console.error("Error fetching listings:", error);
      }
    };
    fetchListings();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      {/* Main content wrapper with flex-1 to push footer down */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="text-center py-12 px-4 sm:py-16 bg-gradient-to-br from-blue-50 to-blue-100">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Discover Your Next Space
          </h1>
          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            Find and manage your ideal apartment with Murandi’s seamless rental
            experience.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {["tenant", "landlord", "admin"].map((role) => (
              <div key={role} className="flex flex-col items-center gap-3">
                <Link
                  to={`/login/${role}`}
                  className="bg-blue-600 text-white px-6 py-2.5 rounded-md hover:bg-blue-700 transition text-sm font-medium shadow-sm"
                >
                  Login as {role.charAt(0).toUpperCase() + role.slice(1)}
                </Link>
                <Link
                  to={`/signup/${role}`}
                  className="text-blue-600 hover:text-blue-800 transition text-sm font-medium"
                >
                  Register as {role.charAt(0).toUpperCase() + role.slice(1)}
                </Link>
                
              </div>
            ))}
          </div>
        </section>

        {/* Listings Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-8 text-center">
            Available Apartments
          </h2>
          {listings.length === 0 ? (
            <p className="text-center text-gray-500 text-lg">
              <Spinner />
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((apt) => (
                <div
                  key={apt.id}
                  className={`group bg-white rounded-sm overflow-hidden shadow-md  transition border border-gray-100 ${
                    apt.leasingstatus === "Leased"
                      ? "ring-2 ring-green-300"
                      : ""
                  }`}
                >
                  <div className="relative h-48 sm:h-56">
                    <img
                      src={apt.image}
                      alt={apt.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-md text-xs font-medium shadow-sm">
                        {apt.beds === "studio"
                          ? "Studio"
                          : `${apt.beds || 1} Beds`}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-md text-xs font-medium shadow-sm ${
                          apt.leasingstatus === "Leased"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {apt.leasingstatus === "Leased" ? "Leased" : "Unleased"}
                      </span>
                    </div>
                  </div>
                  <div className="p-5 space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition line-clamp-1">
                      {apt.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {apt.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Price</span>
                      <span className="text-lg font-bold text-blue-600">
                        KES {Number(apt.price).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-gray-600 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Bath size={16} className="text-blue-600" />
                        {apt.baths || 1} Bath{apt.baths !== 1 ? "s" : ""}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Maximize size={16} className="text-blue-600" />
                        {apt.square_feet?.toLocaleString() || 1200} sqft
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer noSidebar />
    </div>
  );
}

export default LandingPage;
