import React, { useState } from 'react';
import axios from 'axios';

const AddressSearch = () => {
    const [searchInput, setSearchInput] = useState('');
    const [suggestions, setSuggestions] = useState([]);

    // Replicated function from map.js to handle input changes
    const handleInputChange = async (e) => {
        const value = e.target.value;
        setSearchInput(value);
        if (value.length > 2) {
            fetchAddressSuggestions(value);
        } else {
            setSuggestions([]);
        }
    };

    // Replicated function from map.js to fetch address suggestions
    const fetchAddressSuggestions = async (query) => {
        try {
            // Using Nominatim's search API as an example.
            const response = await axios.get('https://nominatim.openstreetmap.org/search', {
                params: {
                    q: query,
                    format: 'json',
                    addressdetails: 1,
                    limit: 5,
                    countrycodes: 'us'
                }
            });
            setSuggestions(response.data);
        } catch (error) {
            console.error('Error fetching address suggestions:', error);
            setSuggestions([]);
        }
    };

    // Replicated function from map.js to handle selecting a suggestion
    const handleSelectLocation = (suggestion) => {
        // For example, you might update the map's center or marker
        console.log('Selected location:', suggestion);
        // Set the selected address in the search input and clear suggestions
        setSearchInput(suggestion.display_name);
        setSuggestions([]);
    };

    return (
        <div className="search-container">
            <h2>Search US Addresses</h2>
            <input
                type="text"
                className="search-box"
                placeholder="Enter US address..."
                value={searchInput}
                onChange={handleInputChange}
            />
            {suggestions.length > 0 && (
                <ul className="suggestions-list">
                    {suggestions.map((suggestion) => (
                        <li
                            key={suggestion.osm_id}
                            className="suggestion-item"
                            onClick={() => handleSelectLocation(suggestion)}
                        >
                            {suggestion.display_name}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default AddressSearch;
