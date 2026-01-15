import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

// Simple Inline Styles (or replace with CSS classes if preferred)
const styles = {
    container: { maxWidth: '800px', margin: '0 auto', padding: '20px' },
    header: { textAlign: 'center', marginBottom: '30px' },
    section: { marginBottom: '40px' },
    faqItem: { border: '1px solid #ddd', borderRadius: '8px', padding: '15px', marginBottom: '15px' },
    question: { fontWeight: 'bold', fontSize: '1.1em', marginBottom: '10px' },
    answer: { marginBottom: '10px' },
    status: { fontStyle: 'italic', fontSize: '0.9em', color: '#666' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px', border: '1px solid #eee', padding: '20px', borderRadius: '8px' },
    textarea: { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '100px' },
    button: { padding: '10px 20px', backgroundColor: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    actionButton: { padding: '5px 10px', marginRight: '5px', cursor: 'pointer', borderRadius: '4px', border: 'none' },
    approveBtn: { backgroundColor: '#28a745', color: '#fff' },
    deleteBtn: { backgroundColor: '#dc3545', color: '#fff' },
    editBtn: { backgroundColor: '#ffc107', color: '#000' }
};

const FAQ = () => {
    const { user } = useAuth();
    const [faqs, setFaqs] = useState([]);
    const [newQuestion, setNewQuestion] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Edit State
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ question: '', answer: '' });

    useEffect(() => {
        fetchFAQs();
    }, [user]);

    const fetchFAQs = async () => {
        try {
            let url = 'http://localhost:5000/api/faqs';
            if (user?.role === 'admin') {
                url = 'http://localhost:5000/api/faqs/all';
            } else if (user?.role === 'advisor') {
                url = 'http://localhost:5000/api/faqs/pending';
            }

            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch FAQs');
            const data = await response.json();
            setFaqs(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitQuestion = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('http://localhost:5000/api/faqs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: newQuestion, user_id: user?.user_id })
            });

            if (response.ok) {
                setNewQuestion('');
                alert('Question submitted successfully! It will appear after approval.');
                fetchFAQs();
            }
        } catch (err) {
            alert('Error submitting question');
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            const response = await fetch(`http://localhost:5000/api/faqs/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (response.ok) fetchFAQs();
        } catch (err) {
            alert('Error updating status');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this FAQ?')) return;
        try {
            const response = await fetch(`http://localhost:5000/api/faqs/${id}`, {
                method: 'DELETE'
            });
            if (response.ok) fetchFAQs();
        } catch (err) {
            alert('Error deleting FAQ');
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`http://localhost:5000/api/faqs/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editForm)
            });
            if (response.ok) {
                setEditingId(null);
                fetchFAQs();
            }
        } catch (err) {
            alert('Error updating FAQ');
        }
    };

    if (loading) return <div>Loading FAQs...</div>;

    return (
        <div style={styles.container}>
            <h1 style={styles.header}>Frequently Asked Questions</h1>

            {/* ADMIN VIEW */}
            {user?.role === 'admin' && (
                <div style={styles.section}>
                    <h2>All FAQs (Admin Control)</h2>
                    {faqs.map(faq => (
                        <div key={faq.faq_id} style={styles.faqItem}>
                            {editingId === faq.faq_id ? (
                                <form onSubmit={handleEditSubmit} style={styles.form}>
                                    <textarea
                                        value={editForm.question}
                                        onChange={e => setEditForm({ ...editForm, question: e.target.value })}
                                        style={styles.textarea}
                                    />
                                    <textarea
                                        value={editForm.answer}
                                        onChange={e => setEditForm({ ...editForm, answer: e.target.value })}
                                        placeholder="Enter answer..."
                                        style={styles.textarea}
                                    />
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button type="submit" style={styles.button}>Save</button>
                                        <button type="button" onClick={() => setEditingId(null)} style={{ ...styles.button, backgroundColor: '#6c757d' }}>Cancel</button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div style={styles.question}>Q: {faq.question}</div>
                                    <div style={styles.answer}>A: {faq.answer || 'No answer yet'}</div>
                                    <div style={styles.status}>Status: {faq.status} | Asked by: {faq.first_name || 'Anonymous'}</div>
                                    <div style={{ marginTop: '10px' }}>
                                        <button
                                            onClick={() => {
                                                setEditingId(faq.faq_id);
                                                setEditForm({ question: faq.question, answer: faq.answer || '' });
                                            }}
                                            style={{ ...styles.actionButton, ...styles.editBtn }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(faq.faq_id)}
                                            style={{ ...styles.actionButton, ...styles.deleteBtn }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* ADVISOR VIEW */}
            {user?.role === 'advisor' && (
                <div style={styles.section}>
                    <h2>Pending Questions</h2>
                    {faqs.length === 0 ? <p>No pending questions.</p> : faqs.map(faq => (
                        <div key={faq.faq_id} style={styles.faqItem}>
                            <div style={styles.question}>{faq.question}</div>
                            <div style={styles.status}>Asked by: {faq.first_name} {faq.last_name}</div>
                            <div style={{ marginTop: '10px' }}>
                                <button
                                    onClick={() => handleStatusUpdate(faq.faq_id, 'accepted')}
                                    style={{ ...styles.actionButton, ...styles.approveBtn }}
                                >
                                    Accept
                                </button>
                                <button
                                    onClick={() => handleDelete(faq.faq_id)}
                                    style={{ ...styles.actionButton, ...styles.deleteBtn }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* STUDENT VIEW */}
            {(!user || user?.role === 'student') && (
                <>
                    <div style={styles.section}>
                        <h2>Ask a Question</h2>
                        <form onSubmit={handleSubmitQuestion} style={styles.form}>
                            <textarea
                                value={newQuestion}
                                onChange={(e) => setNewQuestion(e.target.value)}
                                placeholder="Type your question here..."
                                required
                                style={styles.textarea}
                            />
                            <button type="submit" style={styles.button}>Submit Question</button>
                        </form>
                    </div>

                    <div style={styles.section}>
                        <h2>Common Questions</h2>
                        {faqs.map(faq => (
                            <div key={faq.faq_id} style={styles.faqItem}>
                                <div style={styles.question}>{faq.question}</div>
                                {faq.answer && <div style={styles.answer}>{faq.answer}</div>}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default FAQ;
