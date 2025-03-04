'use client'

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-4 fixed bottom-0 w-full z-50">
      <div className="px-4">
        <div className="flex justify-between items-center">
          <div>
            <p>Chain Watchers</p>
          </div>
          <div className="flex gap-4 justify-content align-items">
            <a href="#" className="hover:text-gray-300">Terms</a>
            <a href="#" className="hover:text-gray-300">Privacy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;