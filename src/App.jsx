
import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

function App() {
  const [search, setSearch] = useState('');
  const [reportType, setReportType] = useState('Lost');
  const [imagePreview, setImagePreview] = useState('');
  const [items, setItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [typeFilter, setTypeFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
  if (!selectedItem) return;

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setSelectedItem(null);
    }
  };

  window.addEventListener('keydown', handleKeyDown);

  return () => {
    window.removeEventListener('keydown', handleKeyDown);
  };
}, [selectedItem]);

const fetchItems = useCallback(async () => {
  const { data, error } = await supabase
    .from('items')
    .select('id, item_name, category, location, item_date, report_type, description, image_path');

  if (error) {
    console.error('Error fetching items:', error);
    return [];
  }

  const formattedItems = data.map((item) => ({
    id: item.id,
    name: item.item_name,
    category: item.category,
    location: item.location,
    date: item.item_date
      ? new Date(item.item_date + 'T00:00:00').toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric'
        })
      : '',
    status: item.report_type,
    icon: item.report_type === 'Lost' ? '🔍' : '📦',
    description: item.description,
    imageUrl: item.image_path
      ? supabase.storage
          .from('item-images')
          .getPublicUrl(item.image_path).data.publicUrl
      : null
  }));

  return formattedItems;
}, []);

useEffect(() => {
  let ignore = false;

  async function loadItems() {
    const updatedItems = await fetchItems();

    if (!ignore) {
      setItems(updatedItems);
    }
  }

  loadItems();

  return () => {
    ignore = true;
  };
}, [fetchItems]);

function handleImageChange(e) {
  const file = e.target.files[0];

  if (!file) {
    setImagePreview('');
    return;
  }

  if (!file.type.startsWith('image/')) {
    alert('Please select an image file.');
    e.target.value = '';
    setImagePreview('');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    alert('Image size must not exceed 5MB.');
    e.target.value = '';
    setImagePreview('');
    return;
  }

  setImagePreview(URL.createObjectURL(file));
}


async function handleReportSubmit(e) {
  e.preventDefault();

  const formData = new FormData(e.target);

  const itemName = formData.get('itemName');
  const category = formData.get('category');
  const itemDate = formData.get('itemDate');
  const location = formData.get('location');
  const description = formData.get('description');
  const contactName = formData.get('contactName');
  const contactInfo = formData.get('contactInfo');
  const image = formData.get('itemImage');
  
  console.log('Form data:', [...formData.entries()]);
  console.log('Item date value:', itemDate);

  try {
    let imagePath = null;

    // Upload image if one was selected
    if (image && image.size > 0) {
      const fileExtension = image.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExtension}`;

      const { data: uploadData, error: uploadError } =
        await supabase.storage
          .from('item-images')
          .upload(fileName, image);

      if (uploadError) {
        throw uploadError;
      }

      imagePath = uploadData.path;
    }

    // Save public item information
const { error: insertError } = await supabase.rpc('submit_item_report', {
  p_report_type: reportType,
  p_item_name: itemName,
  p_category: category,
  p_item_date: itemDate,
  p_location: location,
  p_description: description,
  p_image_path: imagePath,
  p_contact_name: contactName,
  p_contact_info: contactInfo
});

if (insertError) {
  throw insertError;
}

// Save private contact information separately

    alert('Your item report was submitted successfully!');

    e.target.reset();
    setImagePreview('');
    setReportType('Lost');

  } catch (error) {
    console.error('Submission error:', error);
    alert('Unable to submit your report. Please try again.');
  }
}


 const filteredItems = items.filter((item) => {
  const searchText = search.toLowerCase();

const matchesSearch =
  (item.name || '').toLowerCase().includes(searchText) ||
  (item.category || '').toLowerCase().includes(searchText) ||
  (item.location || '').toLowerCase().includes(searchText);

  const matchesType =
    typeFilter === 'All' || item.status === typeFilter;

  const matchesCategory =
    categoryFilter === 'All' || item.category === categoryFilter;

  return matchesSearch && matchesType && matchesCategory;
});
const sortedItems = [...filteredItems].sort((a, b) => {
  if (sortOrder === 'default') return 0;

  const dateA = new Date(a.date).getTime();
  const dateB = new Date(b.date).getTime();

  if (sortOrder === 'newest') {
    return dateB - dateA;
  }

  return dateA - dateB;
});
const itemsPerPage = 8;

const totalPages = Math.ceil(sortedItems.length / itemsPerPage);

const startIndex = (currentPage - 1) * itemsPerPage;

const currentItems = sortedItems.slice(
  startIndex,
  startIndex + itemsPerPage
);
  return (
    
    <div className="app">

      {/* Navigation Bar */}
      <header className="navbar">
        <a href="#" className="logo">
          <span className="logo-icon">🔎</span>
         <span>iBU<span className="logo-highlight">Find</span></span>
        </a>

        <nav>
          <a href="#">Home</a>
          <a href="#items">Browse Items</a>
          <a href="#how-it-works">How It Works</a>
        </nav>

        <a href="#report" className="nav-button">
          Report an Item
        </a>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <span className="welcome-label">
            SCHOOL LOST & FOUND SYSTEM
          </span>

          <h1>
            Lost Something?
            <br />
            <span>Let's Find It.</span>
          </h1>

          <p>
            A simple and convenient way to report lost belongings,
            find recovered items, and help return them to their
            rightful owners within our school community.
          </p>

          <div className="hero-buttons">
            <a href="#items" className="primary-button">
              Browse Items →
            </a>

            <a href="#report" className="secondary-button">
              Report an Item
            </a>
          </div>
        </div>

        <div className="hero-illustration">
          <div className="illustration-circle">
            <span>🎒</span>
            <span>🔑</span>
            <span>👛</span>
            <span>📱</span>
            <div className="search-illustration">🔍</div>
          </div>
          <p>Every lost item deserves a way home.</p>
        </div>
      </section>

      {/* Search Section */}
      <section className="search-section">
        <div>
          <h2>Find Your Missing Belongings</h2>
          <p>Search through the items reported by our school community.</p>
        </div>

        <div className="search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search item name, category, or location..."
            value={search}
            onChange={(e) => {
  setSearch(e.target.value);
  setCurrentPage(1);
}}
          />
             </div>

      <div className="filter-buttons">
        <button
          className={typeFilter === 'All' ? 'active' : ''}
          onClick={() => {
  setTypeFilter('All');
  setCurrentPage(1);
}}
        >
          All
        </button>

        <button
          className={typeFilter === 'Lost' ? 'active' : ''}
         onClick={() => {
  setTypeFilter('Lost');
  setCurrentPage(1);
}}
        >
          Lost
        </button>

        <button
          className={typeFilter === 'Found' ? 'active' : ''}
          onClick={() => {
  setTypeFilter('Found');
  setCurrentPage(1);
}}
        >
          Found
        </button>
      </div>
      <div className="category-filter">
  {['Electronics', 'School Supplies', 'Personal Belongings', 'Clothing', 'Accessories', 'Others'].map((category) => (
    <button
      key={category}
      className={categoryFilter === category ? 'active' : ''}
     onClick={() => {
  setCategoryFilter(category);
  setCurrentPage(1);
}}
    >
      {category}
    </button>
  ))}

  <button
    className={categoryFilter === 'All' ? 'active' : ''}
    onClick={() => {
  setCategoryFilter('All');
  setCurrentPage(1);
}}
  >
    All Categories
  </button>
</div>
<div className="sort-container">
  <label htmlFor="sortOrder">Sort by Date:</label>

  <select
    id="sortOrder"
    value={sortOrder}
    onChange={(e) => {
  setSortOrder(e.target.value);
  setCurrentPage(1);
}}
  >
    <option value="newest">Newest First</option>
    <option value="oldest">Oldest First</option>
    <option value="default">Default</option>
  </select>
</div>
    </section>
      {/* Items Section */}
      <section className="items-section" id="items">
        <div className="section-heading">
          <div>
            <h2>Recently Reported Items</h2>
            <p>Check if someone has already reported your missing item.</p>
          </div>

          <span className="item-count">
            {filteredItems.length} Items
          </span>
        </div>

        <div className="items-grid">
          {filteredItems.length > 0 ? (
            currentItems.map((item) => (
              <div
  className="item-card"
  key={item.id}
  onClick={() => setSelectedItem(item)}
  style={{ cursor: 'pointer' }}
>
                <div className="item-image">
  {item.imageUrl ? (
    <img
      src={item.imageUrl}
      alt={item.name}
      className="reported-item-image"
    />
   ) : (
    <span className="item-placeholder">
      {item.icon}
    </span>
  )}

  <span className={`status ${item.status.toLowerCase()}`}>
    {item.status}
  </span>
 </div>

                <div className="item-details">
                  <h3>{item.name}</h3>
                  <p>{item.category}</p>

                  <div className="item-info">
                    <span>📍 {item.location}</span>
                    <span>📅 {item.date}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="no-results">
              No matching items found. Try another search.
            </p>
                    )}
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index + 1}
                className={currentPage === index + 1 ? 'active' : ''}
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </section>


{/* Report Item Section */}
<section className="report-section" id="report">

  <div className="report-heading">
    <h2>Report an Item</h2>
    <p>Lost something or found someone else's belongings? Let us know.</p>
  </div>

  <div className="report-container">

    <div className="report-tabs">
      <button
        type="button"
        className={reportType === 'Lost' ? 'active lost-tab' : ''}
        onClick={() => setReportType('Lost')}
      >
        🔍 Report Lost Item
      </button>

      <button
        type="button"
        className={reportType === 'Found' ? 'active found-tab' : ''}
        onClick={() => setReportType('Found')}
      >
        📦 Report Found Item
      </button>
    </div>

    <form onSubmit={handleReportSubmit}>

      <h3>Item Information</h3>

      <div className="form-grid">

        <div className="form-group">
          <label>Item Name *</label>
          <input
            type="text"
            name="itemName"
            placeholder="e.g. Black Wallet"
            required
          />
        </div>

        <div className="form-group">
          <label>Category *</label>
          <select name="category" required defaultValue="">
            <option value="" disabled>Select category</option>
            <option>Electronics</option>
            <option>School Supplies</option>
            <option>Personal Belongings</option>
            <option>Clothing</option>
            <option>Accessories</option>
            <option>Others</option>
          </select>
        </div>

        <div className="form-group">
  <label>Date *</label>
  <input
    type="date"
    name="itemDate"
    required
  />
</div>
        <div className="form-group">
          <label>Location *</label>
          <input
            type="text"
            name="location"
            placeholder="e.g. School Library"
            required
          />
        </div>

<div className="form-group full-width">
  <label>Upload Item Photo (Optional)</label>

  <input
    type="file"
    name="itemImage"
    accept="image/*"
    onChange={handleImageChange}
  />

  <small className="upload-hint">
    Accepted image formats only. Maximum file size: 5MB.
  </small>

  {imagePreview && (
    <div className="image-preview">
      <img src={imagePreview} alt="Item preview" />

      <button
        type="button"
        className="remove-image"
        onClick={() => {
  setTypeFilter('Lost');
  setCurrentPage(1);
}}
      >
        Remove Image ✕
      </button>
    </div>
  )}
</div>

        <div className="form-group full-width">
          <label>Description *</label>
          <textarea
            name="description"
            placeholder="Provide details about the item..."
            rows="4"
            required
          />
        </div>

      </div>

      <div className="form-divider"></div>

      <h3>Your Contact Information</h3>
      <p className="privacy-note">
        Your contact information will be kept private and will not
        appear in public item listings.
      </p>

      <div className="form-grid">

        <div className="form-group">
          <label>Your Name *</label>
          <input
            type="text"
            name="contactName"
            placeholder="Enter your name"
            required
          />
        </div>

        <div className="form-group">
          <label>Email or Contact Number *</label>
          <input
            type="text"
            name="contactInfo"
            placeholder="Enter your contact information"
            required
          />
        </div>

      </div>

      <button type="submit" className="submit-report">
        Submit {reportType} Report →
      </button>

    </form>
  </div>
</section>

      {/* How It Works */}
      <section className="how-section" id="how-it-works">
        <h2>How Does It Work?</h2>
        <p>Helping lost belongings find their way back home.</p>

        <div className="steps-grid">
          <div className="step-card">
            <span>📝</span>
            <h3>Report an Item</h3>
            <p>Submit details about an item you lost or found.</p>
          </div>

          <div className="step-card">
            <span>🔍</span>
            <h3>Search and Find</h3>
            <p>Browse reported items and look for your belongings.</p>
          </div>

          <div className="step-card">
            <span>🤝</span>
            <h3>Claim Your Item</h3>
            <p>Submit a claim and provide proof of ownership.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
      <h3>iBUFind</h3>
        <p>Helping our school community reconnect with their belongings.</p>
        <p>© 2026 School Lost and Found Management System</p>
      </footer>
{selectedItem && (
  <div
  className="item-modal-overlay"
  onClick={() => setSelectedItem(null)}
>
    <div
  className="item-modal"
  onClick={(e) => e.stopPropagation()}
>

      <button
        className="modal-close"
        onClick={() => setSelectedItem(null)}
      >
        ✕
      </button>

      <h2>Item Details</h2>

      {selectedItem.imageUrl ? (
        <img
          src={selectedItem.imageUrl}
          alt={selectedItem.name}
          className="modal-item-image"
        />
      ) : (
        <div className="modal-no-image">
          {selectedItem.icon}
        </div>
      )}

      <span className={`status ${selectedItem.status.toLowerCase()}`}>
        {selectedItem.status}
      </span>

      <h3>{selectedItem.name}</h3>

      <p><strong>Category:</strong> {selectedItem.category}</p>
      <p><strong>Location:</strong> {selectedItem.location}</p>
      <p><strong>Date:</strong> {selectedItem.date}</p>

      <div className="modal-description">
        <strong>Description:</strong>
        <p>{selectedItem.description || 'No description provided.'}</p>
      </div>

      <button
        className="modal-done"
        onClick={() => setSelectedItem(null)}
      >
        Close
      </button>

    </div>
  </div>
)}
    </div>
  );
}

export default App;
