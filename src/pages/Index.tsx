import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import FeaturedProperties from "@/components/FeaturedProperties";
import StatsSection from "@/components/StatsSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection />
      <FeaturedProperties />
      <StatsSection />
      
      {/* Footer */}
      <footer className="bg-real-estate-navy text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">EstateFind</h3>
              <p className="text-white/80 text-sm">
                Your trusted partner in finding the perfect home. 
                We make buying and selling real estate simple and stress-free.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li><a href="#" className="hover:text-real-estate-gold transition-colors">Buy Properties</a></li>
                <li><a href="#" className="hover:text-real-estate-gold transition-colors">Sell Properties</a></li>
                <li><a href="#" className="hover:text-real-estate-gold transition-colors">Rent Properties</a></li>
                <li><a href="#" className="hover:text-real-estate-gold transition-colors">Property Management</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li><a href="#" className="hover:text-real-estate-gold transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-real-estate-gold transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-real-estate-gold transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-real-estate-gold transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2 text-sm text-white/80">
                <li><a href="#" className="hover:text-real-estate-gold transition-colors">Facebook</a></li>
                <li><a href="#" className="hover:text-real-estate-gold transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-real-estate-gold transition-colors">Instagram</a></li>
                <li><a href="#" className="hover:text-real-estate-gold transition-colors">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-sm text-white/80">
            <p>&copy; 2024 EstateFind. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
