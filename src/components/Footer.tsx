import { Link } from 'react-router-dom';
import { Home, Mail, Phone, MapPin, Facebook, Twitter, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="mt-20 bg-primary text-white">
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white/12 flex items-center justify-center border border-white/10">
                <Home className="w-4 h-4 text-white" />
              </div>
              <span className="font-heading font-bold text-lg text-white">Havenly Spaces</span>
            </Link>
            <p className="text-sm text-white/72 leading-relaxed">
              Verified rooms, secure payments, monthly rent workflows, and calmer housing decisions for students and owners.
            </p>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4 text-white">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { to: '/', label: 'Home' },
                { to: '/rooms', label: 'Explore Rooms' },
                { to: '/about', label: 'About Us' },
                { to: '/contact', label: 'Contact Us' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-white/72 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4 text-white">Support</h4>
            <ul className="space-y-2">
              {[
                { to: '/faq', label: 'FAQs' },
                { to: '/privacy', label: 'Privacy Policy' },
                { to: '/terms', label: 'Terms & Conditions' },
                { to: '/auth', label: 'Sign In' },
              ].map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-white/72 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-heading font-semibold mb-4 text-white">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-white/72">
                <Mail className="w-4 h-4 text-white" /> support@havenlyspaces.com
              </li>
              <li className="flex items-center gap-2 text-sm text-white/72">
                <Phone className="w-4 h-4 text-white" /> +91 xxxxxxxxxx
              </li>
              <li className="flex items-center gap-2 text-sm text-white/72">
                <MapPin className="w-4 h-4 text-white" /> Jabalpur, Madhya Pradesh, India
              </li>
            </ul>
            <div className="flex gap-3 mt-4">
              {[Facebook, Twitter, Instagram].map((Icon, i) => (
                <button key={i} className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center text-white/72 hover:text-white hover:bg-white/14 transition-all">
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/12 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/60">© {new Date().getFullYear()} Havenly Spaces. All rights reserved.</p>
          <div className="flex gap-4">
            {[
              { to: '/privacy', label: 'Privacy Policy' },
              { to: '/terms', label: 'Terms of Service' },
              { to: '/faq', label: 'FAQ' },
            ].map((item) => (
              <Link key={item.to} to={item.to} className="text-xs text-white/60 hover:text-white transition-colors">
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
