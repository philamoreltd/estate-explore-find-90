import { useParams, useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import PropertyForm from "@/components/PropertyForm";
import ProtectedRoute from "@/components/ProtectedRoute";

const EditProperty = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const handleSuccess = () => {
    navigate("/landlords");
  };

  const handleCancel = () => {
    navigate("/landlords");
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PropertyForm 
            propertyId={id} 
            onSuccess={handleSuccess} 
            onCancel={handleCancel} 
          />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default EditProperty;