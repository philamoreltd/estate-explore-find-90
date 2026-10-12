import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import BottomNavigation from "@/components/BottomNavigation";
import PropertyForm from "@/components/PropertyForm";
import ProtectedRoute from "@/components/ProtectedRoute";
import SEO from "@/components/SEO";

const AddProperty = () => {
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate("/landlords");
  };

  const handleCancel = () => {
    navigate("/landlords");
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background pb-16 md:pb-0">
        <SEO
          title="List a new property | Housevilla"
          description="Add a new rental property listing on Housevilla."
          path="/add-property"
          noindex
        />
        <Navigation />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-real-estate-navy mb-6">
            List a new property
          </h1>
          <PropertyForm onSuccess={handleSuccess} onCancel={handleCancel} />
        </main>
        <BottomNavigation />
      </div>
    </ProtectedRoute>
  );
};

export default AddProperty;
