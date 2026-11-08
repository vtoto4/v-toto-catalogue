import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nedpupblqyrcjbblnfje.supabase.co',
  'sb_publishable_Pp943k6JZKzKJShasr0sCg_Z63aP76z'
);

const WHATSAPP = '966509332872';

function App() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [admin, setAdmin] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [image, setImage] = useState(null);
  const [newCategory, setNewCategory] = useState('');

  async function loadData() {
    const { data: p, error: pe } = await supabase
      .from('products').select('*').order('created_at', { ascending: false });

    const { data: c, error: ce } = await supabase
      .from('categories').select('*').order('name');

    if (pe) console.error(pe.message);
    if (ce) console.error(ce.message);

    setProducts(p || []);
    setCategories(c || []);
  }

  async function checkAdmin(user) {
    if (!user) {
      setAdmin(false);
      return;
    }

    const { data } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle();

    setAdmin(!!data);
  }

  useEffect(() => {
    loadData();

    supabase.auth.getSession().then(({ data }) => {
      checkAdmin(data.session?.user);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => checkAdmin(session?.user)
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  async function login() {
    const email = prompt('Admin Email');
    const password = prompt('Password');

    if (!email || !password) return;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) alert(error.message);
  }

  async function addCategory(e) {
    e.preventDefault();

    const { error } = await supabase.from('categories').insert({
      name: newCategory.trim()
    });

    if (error) return alert(error.message);

    setNewCategory('');
    loadData();
  }

  async function addProduct(e) {
    e.preventDefault();

    if (!name || !image) {
      alert('Product name and photo required');
      return;
    }

    const fileName = ${Date.now()}-${image.name};

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, image);

    if (uploadError) return alert(uploadError.message);

    const { data: imageData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    const { error } = await supabase.from('products').insert({
      name,
      description,
      category_id: categoryId || null,
      image_url: imageData.publicUrl
    });

    if (error) return alert(error.message);

    setName('');
    setDescription('');
    setImage(null);
    setCategoryId('');
    loadData();
    alert('Product added successfully!');
  }

  async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;

    const { error } = await supabase
      .from('products').delete().eq('id', id);

    if (error) return alert(error.message);

    loadData();
  }

  const filtered = products.filter(p =>
    (p.name || '').toLowerCase().includes(search.toLowerCase()) &&
    (category === 'All' || String(p.category_id) === category)
  );

  return (
    <main style={{
      fontFamily: 'Arial',
      padding: 20,
      maxWidth: 1100,
      margin: 'auto'
    }}>

      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1>V-TOTO</h1>
        <button onClick={login}>Admin Login</button>
      </header>

      <h2>Online Product Catalogue</h2>

      <input
        placeholder="Search products..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ padding: 12, width: '100%', boxSizing: 'border-box' }}
      />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: 15 }}>
        <button onClick={() => setCategory('All')}>All</button>

        {categories.map(c => (
          <button key={c.id} onClick={() => setCategory(String(c.id))}>
            {c.name}
          </button>
        ))}
      </div>

      {admin && (
        <section style={{ background: '#f1f1f1', padding: 15 }}>
          <h2>Admin Panel</h2>

          <form onSubmit={addCategory}>
            <h3>Add Category</h3>
            <input
              required
              placeholder="Category name"
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
            />
            <button type="submit">Add Category</button>
          </form>

          <hr />

          <form onSubmit={addProduct}>
            <h3>Add Product</h3>

            <input
              required
              placeholder="Product name"
              value={name}
              onChange={e => setName(e.target.value)}
            />

            <br /><br />

            <textarea
              placeholder="Description"
              value={description}
              onChange={e => setDescription(e.target.value)}
            />

            <br /><br />

            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
            >
              <option value="">Select Category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <br /><br />

            <input
              type="file"
              accept="image/*"
              onChange={e => setImage(e.target.files[0])}
            />

            <br /><br />

            <button type="submit">Add Product</button>
          </form>

          <button onClick={() => supabase.auth.signOut()}>
            Logout
          </button>
        </section>
      )}

      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))',
        gap: 15
      }}>
        {filtered.map(p => (
          <article key={p.id} style={{
            border: '1px solid #ddd',
            padding: 10,
            borderRadius: 8
          }}>
            <img
              src={p.image_url}
              alt={p.name}
              style={{
                width: '100%',
                height: 180,
                objectFit: 'contain'
              }}
            />

            <h3>{p.name}</h3>
            <p>{p.description}</p>

            <a
              target="_blank"
              rel="noreferrer"
              href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
                'I am interested in: ' + p.name
              )}`}
            >
              <button>Enquire on WhatsApp</button>
            </a>

            {admin && (
              <button onClick={() => deleteProduct(p.id)}>
                Delete
              </button>
            )}
          </article>
        ))}
      </section>

    </main>
  );
}

export default App;
