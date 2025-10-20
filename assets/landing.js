/**
 * Landing Wizard Script
 * Manages the step-by-step wizard for collecting initial user data
 */

(function() {
    'use strict';

    // State management
    const state = {
        currentStep: 1,
        country: null,
        household: null,
        birthYear: null,
        birthMonth: null,
        emigrationYear: null,
        emigrationMonth: null
    };

    // Initialize on DOM load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeLanding);
    } else {
        initializeLanding();
    }

    function initializeLanding() {
        console.log('Landing wizard initializing...');
        
        // Populate dropdowns
        populateBirthYears();
        populateBirthMonths();
        populateEmigrationYears();
        populateEmigrationMonths();
        
        // Setup event listeners
        setupCountryButtons();
        setupHouseholdButtons();
        setupBirthInputs();
        setupNavigation();
        setupCompletionButton();
    }

    function populateBirthYears() {
        const select = document.getElementById('landing-birth-year');
        if (!select) return;
        
        const currentYear = new Date().getFullYear();
        const startYear = 1940;
        const endYear = currentYear - 18; // Minimum age 18
        
        for (let year = endYear; year >= startYear; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            if (year === 1960) {
                option.selected = true;
            }
            select.appendChild(option);
        }
    }

    function populateBirthMonths() {
        const select = document.getElementById('landing-birth-month');
        if (!select) return;
        
        const months = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
        months.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = index + 1;
            option.textContent = month;
            select.appendChild(option);
        });
        
        // Select January by default
        select.value = '1';
    }

    function populateEmigrationYears() {
        const select = document.getElementById('landing-emigration-year');
        if (!select) return;
        
        const currentYear = new Date().getFullYear();
        const startYear = currentYear - 10;
        const endYear = currentYear + 20;
        
        for (let year = endYear; year >= startYear; year--) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            select.appendChild(option);
        }
    }

    function populateEmigrationMonths() {
        const select = document.getElementById('landing-emigration-month');
        if (!select) return;
        
        const months = ['Jan', 'Feb', 'Mrt', 'Apr', 'Mei', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'];
        months.forEach((month, index) => {
            const option = document.createElement('option');
            option.value = index + 1;
            option.textContent = month;
            select.appendChild(option);
        });
    }

    function setupCountryButtons() {
        const nlBtn = document.getElementById('btn-country-nl');
        const beBtn = document.getElementById('btn-country-be');
        const nextBtn = document.getElementById('next-1');
        
        if (!nlBtn || !beBtn || !nextBtn) return;
        
        nlBtn.addEventListener('click', function() {
            selectCountry('NL', nlBtn, beBtn, nextBtn);
        });
        
        beBtn.addEventListener('click', function() {
            selectCountry('BE', beBtn, nlBtn, nextBtn);
        });
    }

    function selectCountry(country, selectedBtn, otherBtn, nextBtn) {
        state.country = country;
        selectedBtn.classList.add('selected');
        otherBtn.classList.remove('selected');
        nextBtn.disabled = false;
        console.log('Country selected:', country);
    }

    function setupHouseholdButtons() {
        const singleBtn = document.getElementById('btn-household-single');
        const coupleBtn = document.getElementById('btn-household-couple');
        const nextBtn = document.getElementById('next-2');
        
        if (!singleBtn || !coupleBtn || !nextBtn) return;
        
        singleBtn.addEventListener('click', function() {
            selectHousehold('single', singleBtn, coupleBtn, nextBtn);
        });
        
        coupleBtn.addEventListener('click', function() {
            selectHousehold('couple', coupleBtn, singleBtn, nextBtn);
        });
    }

    function selectHousehold(type, selectedBtn, otherBtn, nextBtn) {
        state.household = type;
        selectedBtn.classList.add('selected');
        otherBtn.classList.remove('selected');
        nextBtn.disabled = false;
        console.log('Household selected:', type);
    }

    function setupBirthInputs() {
        const yearSelect = document.getElementById('landing-birth-year');
        const monthSelect = document.getElementById('landing-birth-month');
        const nextBtn = document.getElementById('next-3');
        
        if (!yearSelect || !monthSelect || !nextBtn) return;
        
        function checkBirthInputs() {
            const yearValue = yearSelect.value;
            const monthValue = monthSelect.value;
            
            if (yearValue && monthValue) {
                state.birthYear = parseInt(yearValue, 10);
                state.birthMonth = parseInt(monthValue, 10);
                nextBtn.disabled = false;
            } else {
                nextBtn.disabled = true;
            }
        }
        
        yearSelect.addEventListener('change', checkBirthInputs);
        monthSelect.addEventListener('change', checkBirthInputs);
        
        // Check initial state
        checkBirthInputs();
    }

    function setupNavigation() {
        // Next buttons
        document.getElementById('next-1')?.addEventListener('click', () => goToStep(2));
        document.getElementById('next-2')?.addEventListener('click', () => goToStep(3));
        document.getElementById('next-3')?.addEventListener('click', () => goToStep(4));
        
        // Back buttons
        document.getElementById('back-2')?.addEventListener('click', () => goToStep(1));
        document.getElementById('back-3')?.addEventListener('click', () => goToStep(2));
        document.getElementById('back-4')?.addEventListener('click', () => goToStep(3));
    }

    function goToStep(stepNumber) {
        // Hide current step
        const currentStepEl = document.getElementById(`step-${state.currentStep}`);
        if (currentStepEl) {
            currentStepEl.classList.remove('active');
        }
        
        // Show new step
        const newStepEl = document.getElementById(`step-${stepNumber}`);
        if (newStepEl) {
            newStepEl.classList.add('active');
        }
        
        state.currentStep = stepNumber;
        console.log('Moved to step:', stepNumber);
    }

    function setupCompletionButton() {
        const completeBtn = document.getElementById('btn-complete');
        if (!completeBtn) return;
        
        completeBtn.addEventListener('click', completeLanding);
    }

    function completeLanding() {
        console.log('Completing landing wizard...');
        
        // Get emigration values (optional)
        const emigYearSelect = document.getElementById('landing-emigration-year');
        const emigMonthSelect = document.getElementById('landing-emigration-month');
        
        if (emigYearSelect && emigYearSelect.value) {
            state.emigrationYear = parseInt(emigYearSelect.value, 10);
        }
        if (emigMonthSelect && emigMonthSelect.value) {
            state.emigrationMonth = parseInt(emigMonthSelect.value, 10);
        }
        
        // Save to localStorage
        const landingData = {
            country: state.country,
            household: state.household,
            birthYear: state.birthYear,
            birthMonth: state.birthMonth,
            emigrationYear: state.emigrationYear,
            emigrationMonth: state.emigrationMonth,
            timestamp: new Date().toISOString()
        };
        
        try {
            localStorage.setItem('fk_landing', JSON.stringify(landingData));
            console.log('Landing data saved to localStorage:', landingData);
        } catch (e) {
            console.error('Failed to save to localStorage:', e);
        }
        
        // Transfer to main form
        transferToMainForm(landingData);
        
        // Dispatch custom event
        const event = new CustomEvent('fk:landing:complete', {
            detail: landingData
        });
        document.dispatchEvent(event);
        console.log('Dispatched fk:landing:complete event');
        
        // Hide landing and show main form
        const landingEl = document.getElementById('landing-step');
        const mainFormEl = document.getElementById('main-form');
        
        if (landingEl) {
            landingEl.style.display = 'none';
        }
        
        if (mainFormEl) {
            mainFormEl.style.display = 'block';
        }
        
        console.log('Landing wizard completed!');
    }

    function transferToMainForm(data) {
        console.log('Transferring data to main form...');
        
        // Birth year and month for partner 1
        const birthYear1 = document.getElementById('birth-year-1');
        if (birthYear1 && data.birthYear) {
            birthYear1.value = data.birthYear;
            console.log('Set birth-year-1:', data.birthYear);
        }
        
        const birthMonth1 = document.getElementById('birth-month-1');
        if (birthMonth1 && data.birthMonth) {
            birthMonth1.value = data.birthMonth;
            console.log('Set birth-month-1:', data.birthMonth);
        }
        
        // Simulation/emigration date
        if (data.emigrationYear) {
            const simYear = document.getElementById('sim-year');
            if (simYear) {
                simYear.value = data.emigrationYear;
                console.log('Set sim-year:', data.emigrationYear);
            }
        }
        
        if (data.emigrationMonth) {
            const simMonth = document.getElementById('sim-month');
            if (simMonth) {
                simMonth.value = data.emigrationMonth;
                console.log('Set sim-month:', data.emigrationMonth);
            }
        }
        
        // Call main app functions if available
        if (typeof window.updateComparisonCountry === 'function') {
            window.updateComparisonCountry(data.country);
            console.log('Called updateComparisonCountry:', data.country);
        }
        
        if (typeof window.updateHouseholdType === 'function') {
            const isCouple = data.household === 'couple';
            window.updateHouseholdType(isCouple);
            console.log('Called updateHouseholdType:', isCouple);
        }
        
        if (typeof window.updateScenario === 'function') {
            // Delay to ensure DOM updates have settled
            setTimeout(() => {
                window.updateScenario();
                console.log('Called updateScenario');
            }, 100);
        }
    }

})();
