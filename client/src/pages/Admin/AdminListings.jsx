import { useState, useEffect } from "react";
import axios from "axios";
import AdminSidebar from "./Sidebar";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { endpoint } from "../../apiEndpoint";
import { Bath, Maximize, Pencil, Trash, PlusCircle, X } from "lucide-react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function AdminListings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isAddListingOpen, setIsAddListingOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    square_feet: "",
    apartmentnumber: "",
    image: "",
  });

  const getListings = async () => {
    try {
      const response = await axios.get(`${endpoint}/listings/all-listings`);
      return response.data;
    } catch (error) {
      throw error.response.data.message;
    }
  };

  useEffect(() => {
    const fetchListings = async () => {
      const data = await getListings();

      // Normalize listings: If "studio" is in the title, override beds
      const normalizedListings = data.map((apt) => {
        const isStudio = apt.title?.toLowerCase().includes("studio");
        return {
          ...apt,
          beds: isStudio ? "studio" : apt.beds,
        };
      });

      setListings(normalizedListings);
    };
    fetchListings();
  }, []);

  const handleCardClick = (listing) => {
    setSelectedListing(listing);
    setIsModalOpen(true);
  };

  const handleUpdateClick = (listing) => {
    setIsUpdateModalOpen(true);
  };

  const handleAddListingClick = () => {
    setIsAddListingOpen(true);
    setFormData({
      title: "",
      description: "",
      price: "",
      square_feet: "",
      apartmentNumber: "",
      image: "",
    });
  };

  const createListing = async () => {
    setIsAddListingOpen(false);
    try {
      await axios.post(`${endpoint}/listings/create-listing`, formData);
      console.log(endpoint)
      setIsAddListingOpen(false);
      const updatedListings = await getListings();
      setListings(updatedListings);
      toast.success("Listing added successfully.");
    } catch (error) {
      console.error(error);
      console.log(error)
      toast.error("Failed to add listing.");
    }
  };

  const updateListing = async () => {
    try {
      await axios.put(
        `${endpoint}/listings/update-listing/${selectedListing.id}`,
        formData
      );
      setIsUpdateModalOpen(false);
      const updatedListings = await getListings();
      setListings(updatedListings);
      toast.success("Listing updated successfully.");
    } catch (error) {
      console.error("Error updating listing:", error);
      toast.error("Failed to update listing.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${endpoint}/listings/delete-listing/${id}`);
      setIsModalOpen(false);
      const updatedListings = await getListings();
      setListings(updatedListings);
      toast.success("Listing deleted.");
    } catch (error) {
      console.error("Error deleting listing:", error);
      alert(error.response?.data?.message || "Could not delete listing.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        closeOnClick
        theme="dark"
        toastClassName="rounded-lg bg-white shadow-md border-l-4 border-blue-500 p-4 text-sm text-gray-800"
        bodyClassName="flex items-center"
        progressClassName="bg-blue-400 h-1 rounded"
      />
      <Navbar
        className="z-10"
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex flex-1">
        <AdminSidebar
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
        />

        <main
          className={`flex-1 p-4 sm:p-6 transition-all duration-300 ${
            sidebarOpen ? "lg:ml-[calc(18rem)]" : "lg:ml-[calc(18rem)] ml-0"
          }`}
        >
          {/* Add Apartment Listing Button */}
          <div className="flex justify-end mb-4 sm:mb-6">
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg hover:bg-blue-600 transition text-sm sm:text-base cursor-pointer"
              onClick={handleAddListingClick}
            >
              <PlusCircle className="w-5 h-5" />
              Add an Apartment Listing
            </button>
          </div>

          {/* Apartment Listings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {listings.map((apt) => (
              <div
                key={apt.id}
                onClick={() => handleCardClick(apt)}
                className={`group bg-white rounded-xl cursor-pointer overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 ${
                  apt.leased ? "ring-2 ring-green-400" : ""
                }`}
              >
                {/* Image Section */}
                <div className="relative h-48 sm:h-64">
                  <img
                    src={apt.image}
                    alt={apt.title}
                    className="w-full h-full object-cover rounded-t-xl"
                  />
                  <div className="absolute top-2 sm:top-4 left-2 sm:left-4 flex gap-2">
                    <span className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium shadow-lg">
                      {apt.beds === "studio"
                        ? "Studio"
                        : `${apt.beds || 2} Bedroom`}
                    </span>
                    <span
                      className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium shadow-lg ${
                        apt.leased
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {apt.leasingstatus === "Leased" ? "Leased" : "Unleased"}
                    </span>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {apt.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-3">
                    {apt.description}
                  </p>

                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm text-gray-500">
                      Price
                    </span>
                    <span className="text-lg sm:text-2xl font-bold text-blue-600">
                      Kes. {apt.price}
                    </span>
                  </div>

                  {/* Beds and Baths */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div className="flex flex-col items-center gap-1 bg-blue-50 p-2 rounded-lg">
                      <Bath className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
                      <span className="text-xs sm:text-sm font-medium text-gray-600">
                        {apt.baths || 1} Baths
                      </span>
                    </div>
                    <div className="flex flex-col items-center gap-1 bg-blue-50 p-2 rounded-lg">
                      <Maximize className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
                      <span className="text-xs sm:text-sm font-medium text-gray-600">
                        {apt.square_feet || 1200} sqft
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
      <Footer />

      {/* Property Modal */}
      {isModalOpen && selectedListing && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 sm:p-8 w-full max-w-[90%] sm:max-w-md space-y-4 sm:space-y-6 shadow-lg relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700"
              onClick={() => setIsModalOpen(false)}
            >
              <X size={20} />
            </button>

            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              {selectedListing.title}
            </h2>
            <img
              src={selectedListing.image}
              alt={selectedListing.title}
              className="w-full h-40 sm:h-48 object-cover rounded-md"
            />
            <p className="text-sm sm:text-base text-gray-600">
              {selectedListing.description}
            </p>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Price</p>
                <p className="text-lg sm:text-xl font-bold text-blue-500">
                  Kes. {selectedListing.price}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Beds / Baths</p>
                <p className="text-sm sm:text-md text-gray-700">
                  {selectedListing.beds} Beds, {selectedListing.baths} Baths
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <button
                className="flex items-center justify-center gap-2 bg-blue-400 text-white px-4 py-2 rounded-md w-full hover:bg-blue-500 transition text-sm sm:text-base"
                onClick={() => {
                  setIsModalOpen(false);
                  setFormData({
                    title: selectedListing.title,
                    description: selectedListing.description,
                    price: selectedListing.price,
                    square_feet: selectedListing.square_feet,
                    apartmentnumber: selectedListing.apartmentnumber,
                    image: selectedListing.image,
                  });
                  setIsUpdateModalOpen(true);
                }}
              >
                <Pencil className="w-4 sm:w-5 h-4 sm:h-5" />
                Update
              </button>
              <button
                className="flex items-center justify-center gap-2 bg-red-400 text-white px-4 py-2 rounded-md w-full hover:bg-red-500 transition text-sm sm:text-base"
                onClick={() => handleDelete(selectedListing.id)}
              >
                <Trash className="w-4 sm:w-5 h-4 sm:h-5" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Property Modal */}
      {isUpdateModalOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 sm:p-8 w-full max-w-[90%] sm:max-w-lg space-y-4 sm:space-y-6 shadow-lg relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={() => setIsUpdateModalOpen(false)}
            >
              <X size={20} />
            </button>

            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              Update Listing
            </h2>

            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                updateListing();
              }}
            >
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    placeholder="Title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="mt-1 block w-full text-sm border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    placeholder="Description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    className="mt-1 block w-full text-sm border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    rows="3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Price (Kes)
                  </label>
                  <input
                    type="number"
                    placeholder="Price"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="mt-1 block w-full text-sm border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Square Feet
                  </label>
                  <input
                    type="number"
                    placeholder="Square Feet"
                    value={formData.square_feet}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        square_feet: e.target.value,
                      })
                    }
                    className="mt-1 block w-full text-sm border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Apartment Number
                  </label>
                  <input
                    type="text"
                    placeholder="Apartment Number"
                    value={formData.apartmentnumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        apartmentnumber: e.target.value,
                      })
                    }
                    className="mt-1 block w-full text-sm border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Image URL
                  </label>
                  <input
                    type="text"
                    placeholder="Image URL"
                    value={formData.image}
                    onChange={(e) =>
                      setFormData({ ...formData, image: e.target.value })
                    }
                    className="mt-1 block w-full text-sm border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 sm:px-6 py-2 rounded-md hover:bg-blue-600 text-sm sm:text-base"
                >
                  Update Listing
                </button>
                <button
                  type="button"
                  onClick={() => setIsUpdateModalOpen(false)}
                  className="bg-gray-300 text-gray-800 px-4 sm:px-6 py-2 rounded-md hover:bg-gray-400 text-sm sm:text-base"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Property Modal */}
      {isAddListingOpen && (
        <div className="fixed inset-0 backdrop-blur-sm bg-white/30 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 sm:p-8 w-full max-w-[90%] sm:max-w-lg space-y-4 sm:space-y-6 shadow-lg relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={() => setIsAddListingOpen(false)}
            >
              <X size={20} />
            </button>

            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              Add New Listing
            </h2>

            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                createListing();
              }}
            >
              <div className="grid grid-cols-1 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Title
                  </label>
                  <input
                    type="text"
                    placeholder="Title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="mt-1 block w-full text-sm border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    placeholder="Description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                    className="mt-1 block w-full text-sm border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    rows="3"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Price (Kes)
                  </label>
                  <input
                    type="number"
                    placeholder="Price"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: e.target.value })
                    }
                    className="mt-1 block w-full text-sm border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Square Feet
                  </label>
                  <input
                    type="number"
                    placeholder="Square Feet"
                    value={formData.square_feet}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        square_feet: e.target.value,
                      })
                    }
                    className="mt-1 block w-full text-sm border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Apartment Number
                  </label>
                  <input
                    type="text"
                    placeholder="Apartment Number"
                    value={formData.apartmentnumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        apartmentnumber: e.target.value,
                      })
                    }
                    className="mt-1 block w-full text-sm border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Image URL
                  </label>
                  <input
                    type="text"
                    placeholder="Image URL"
                    value={formData.image}
                    onChange={(e) =>
                      setFormData({ ...formData, image: e.target.value })
                    }
                    className="mt-1 block w-full text-sm border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 sm:gap-4">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 sm:px-6 py-2 rounded-md hover:bg-blue-600 text-sm sm:text-base cursor-pointer"
                >
                  Add Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}

export default AdminListings;
