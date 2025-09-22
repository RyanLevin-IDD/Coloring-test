import { useState, useEffect } from 'react';
import Link from 'next/link';
import Head from 'next/head';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Filter categories based on search and selection
    let filtered = categories;
    
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(cat => cat.slug === selectedCategory);
    }
    
    if (searchTerm && !searchResults) {
      filtered = filtered.filter(cat => 
        cat.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredCategories(filtered);
  }, [searchTerm, selectedCategory, categories, searchResults]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data);
      setFilteredCategories(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults(null);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();
      setSearchResults(data);
      setSearchLoading(false);
    } catch (error) {
      console.error('Search error:', error);
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSearchResults(null);
    setSelectedCategory('all');
  };

  const handleDownload = async (page) => {
    window.location.href = `/api/download/${page.id}?key=${encodeURIComponent(page.s3Key)}`;
  };

  return (
    <>
      <Head>
        <title>Free Coloring Pages - Download & Print</title>
        <meta name="description" content="Free printable coloring pages for kids and adults." />
      </Head>

      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b-4 border-green-500">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <h1 className="text-3xl font-bold text-green-600">ColoringPages</h1>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Search and Filter Section */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="flex gap-4">
                <input
                  type="text"
                  placeholder="Search coloring pages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Search
                </button>
                {(searchTerm || searchResults) && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </form>

            {/* Category Filter */}
            <div className="flex items-center gap-4">
              <label className="font-medium text-gray-700">Filter by category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Search Results */}
          {searchResults && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                Search Results ({searchResults.length} pages found)
              </h2>
              {searchLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-green-50 border-b">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Preview</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Category</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {searchResults.map((page) => (
                          <tr key={page.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden">
                                <img
                                  src={page.thumbnailUrl}
                                  alt={page.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-gray-800 font-medium">{page.name}</p>
                            </td>
                            <td className="px-6 py-4">
                              <Link href={`/category/${page.categorySlug}`} className="text-green-600 hover:text-green-700">
                                {page.categoryName}
                              </Link>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <button
                                onClick={() => handleDownload(page)}
                                className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                              >
                                Download
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">No coloring pages found matching your search.</p>
              )}
            </div>
          )}

          {/* Categories Grid */}
          {!searchResults && (
            <>
              <h2 className="text-4xl font-bold text-gray-800 mb-8 text-center">
                {selectedCategory === 'all' ? 'Choose a Coloring Category' : `${categories.find(c => c.slug === selectedCategory)?.name || ''} Category`}
              </h2>

              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {filteredCategories.map((category) => (
                    <Link 
                      key={category.id} 
                      href={`/category/${category.slug}`}
                      className="group cursor-pointer"
                    >
                      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
                        <div className="aspect-square relative overflow-hidden bg-gray-100">
                          <img
                            src={category.coverImage}
                            alt={category.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </div>
                        <div className="p-4 bg-green-50">
                          <h3 className="text-lg font-semibold text-gray-800 text-center">
                            {category.name}
                          </h3>
                          <p className="text-sm text-gray-600 text-center mt-1">
                            {category.pageCount} pages
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </>
  );
}