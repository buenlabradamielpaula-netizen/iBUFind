
import { useState } from 'react';
import { supabase } from './supabaseClient';
import './App.css';

function App() {
  const [search, setSearch] = useState('');
  const [reportType, setReportType] = useState('Lost');
  const [imagePreview, setImagePreview] = useState('');

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

    // Save item report
    const { error: insertError } = await supabase
      .from('items')
      .insert({
        report_type: reportType,
        item_name: itemName,
        category: category,
        item_date: itemDate,
        location: location,
        description: description,
        image_path: imagePath,
        contact_name: contactName,
        contact_info: contactInfo,
        status: 'Open'
      });

    if (insertError) {
      throw insertError;
    }

    alert('Your item report was submitted successfully!');

    e.target.reset();
    setImagePreview('');
    setReportType('Lost');

  } catch (error) {
    console.error('Submission error:', error);
    alert('Unable to submit your report. Please try again.');
  }
}

  const items = [
    {
      name: 'Black Wallet',
      category: 'Personal Belongings',
      location: 'School Library',
      date: 'November 5, 2026',
      status: 'Found',
      icon: '👛'
    },
    {
      name: 'Blue Water Bottle',
      category: 'Accessories',
      location: 'Room 203',
      date: 'November 4, 2026',
      status: 'Found',
      icon: '🧴'
    },
    {
      name: 'Student ID',
      category: 'School Supplies',
      location: 'School Canteen',
      date: 'November 3, 2026',
      status: 'Lost',
      icon: '🪪'
    },
    {
      name: 'Black Umbrella',
      category: 'Personal Belongings',
      location: 'School Gym',
      date: 'November 2, 2026',
      status: 'Found',
      icon: '🌂'
    }
  ];

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase()) ||
    item.location.toLowerCase().includes(search.toLowerCase())
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
            onChange={(e) => setSearch(e.target.value)}
          />
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
            filteredItems.map((item, index) => (
              <div className="item-card" key={index}>
                <div className="item-image">
                  <span>{item.icon}</span>
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
          setImagePreview('');
          document.querySelector('input[name="itemImage"]').value = '';
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

    </div>
  );
}

export default App;
