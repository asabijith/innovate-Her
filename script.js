      // Firebase configuration
      const firebaseConfig = {
        apiKey: "AIzaSyAA9k_wUy8W4DUGGC59XKLf1SSA0kJpflk",
        authDomain: "form-e9a10.firebaseapp.com",
        databaseURL: "https://form-e9a10-default-rtdb.firebaseio.com",
        projectId: "form-e9a10",
        storageBucket: "form-e9a10.firebasestorage.app",
        messagingSenderId: "522860381687",
        appId: "1:522860381687:web:10def6869ab957940adaf2",
        measurementId: "G-ZHT6HE42RM"
    };

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();

    // Get DOM elements
    const form = document.getElementById('applicationForm');
    const submitBtn = document.getElementById('submitBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const alert = document.getElementById('alert');
    const applicationsCount = document.getElementById('applicationsCount');
    const successMessage = document.getElementById('successMessage');

    // Show alert function
    function showAlert(message, type) {
        alert.textContent = message;
        alert.className = `alert alert-${type}`;
        alert.style.display = 'block';
        setTimeout(() => {
            alert.style.display = 'none';
        }, 5000);
    }

    // Set loading state
    function setLoading(isLoading) {
        submitBtn.disabled = isLoading;
        loadingSpinner.style.display = isLoading ? 'block' : 'none';
        submitBtn.style.opacity = isLoading ? '0.7' : '1';
    }

    // Show success message
    function showSuccessMessage() {
        form.style.display = 'none';
        successMessage.style.display
        form.style.display = 'none';
        successMessage.style.display = 'block';
        successMessage.scrollIntoView({ behavior: 'smooth' });
    }

    // Validate form data
    function validateFormData(formData) {
        if (!formData.name || formData.name.trim() === '') {
            throw new Error('Please enter your full name.');
        }
        if (!formData.semester) {
            throw new Error('Please select your semester.');
        }
        if (!formData.department) {
            throw new Error('Please select your department.');
        }
        if (!formData.phone || !/^\d{10}$/.test(formData.phone)) {
            throw new Error('Please enter a valid 10-digit phone number.');
        }
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            throw new Error('Please enter a valid email address.');
        }
    }

    // Check application limit
    async function checkApplicationLimit() {
        try {
            const countDoc = await db.collection('metadata').doc('count').get();
            const currentCount = countDoc.exists ? countDoc.data().count : 0;
            const remainingSlots = 30 - currentCount;
            
            applicationsCount.textContent = `Applications remaining: ${remainingSlots}`;
            
            if (currentCount >= 30) {
                form.style.display = 'none';
                showAlert('Application window has closed. Thank you for your interest.', 'warning');
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error checking applications:', error);
            showAlert('Service temporarily unavailable. Please try again later.', 'error');
            return false;
        }
    }

    // Initialize page
    document.addEventListener('DOMContentLoaded', () => {
        checkApplicationLimit();
        initializeDropdowns();
    });

    // Form submission handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const formData = {
                name: document.getElementById('name').value.trim(),
                semester: document.getElementById('semester').value,
                department: document.getElementById('department').value,
                phone: document.getElementById('phone').value.trim(),
                email: document.getElementById('email').value.trim().toLowerCase(),
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            };

            // Validate form data
            validateFormData(formData);

            await db.runTransaction(async (transaction) => {
                const countRef = db.collection('metadata').doc('count');
                const countDoc = await transaction.get(countRef);
                const currentCount = countDoc.exists ? countDoc.data().count : 0;

                if (currentCount >= 30) {
                    throw new Error('Application limit reached. No more submissions accepted.');
                }

                // Save application
                const applicationsRef = db.collection('applications');
                transaction.set(applicationsRef.doc(), formData);
                transaction.set(countRef, { count: currentCount + 1 });
            });

            showSuccessMessage();
            await checkApplicationLimit();
            
        } catch (error) {
            console.error('Submission error:', error);
            showAlert(error.message, error.message.includes('limit') ? 'warning' : 'error');
            if (error.message.includes('limit')) {
                form.style.display = 'none';
            }
        } finally {
            setLoading(false);
        }
    });

    // Dropdown functionality
    function initializeDropdowns() {
        const dropdowns = [
            { header: 'dropdownHeader', menu: 'dropdownMenu', input: 'semester' },
            { header: 'departmentDropdownHeader', menu: 'departmentDropdownMenu', input: 'department' }
        ];

        dropdowns.forEach(dropdown => {
            const header = document.getElementById(dropdown.header);
            const menu = document.getElementById(dropdown.menu);
            const input = document.getElementById(dropdown.input);

            header.addEventListener('click', () => toggleDropdown(menu, header));

            menu.addEventListener('click', (event) => {
                if (event.target.tagName === 'LI') {
                    handleDropdownSelection(event.target, input, header, menu);
                }
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', (event) => {
            dropdowns.forEach(dropdown => {
                const header = document.getElementById(dropdown.header);
                const menu = document.getElementById(dropdown.menu);
                if (!header.contains(event.target) && !menu.contains(event.target)) {
                    menu.classList.remove('open');
                    header.classList.remove('open');
                }
            });
        });
    }

    function toggleDropdown(menu, header) {
        const isOpen = menu.classList.contains('open');
        if (isOpen) {
            menu.classList.remove('open');
            header.classList.remove('open');
        } else {
            menu.classList.add('open');
            header.classList.add('open');
        }
    }

    function handleDropdownSelection(selectedItem, input, header, menu) {
        const selectedValue = selectedItem.getAttribute('data-value');
        const selectedText = selectedItem.textContent;

        input.value = selectedValue;
        header.textContent = selectedText;
        header.insertAdjacentHTML('beforeend', ' <span class="arrow-down">▼</span>');

        menu.classList.remove('open');
        header.classList.remove('open');
    }