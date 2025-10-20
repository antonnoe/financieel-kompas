// Landing step functionality
document.addEventListener('DOMContentLoaded', function() {
    const landingNextBtn = document.getElementById('landing-next-btn');
    const landingStep = document.getElementById('landing-step');
    const mainForm = document.getElementById('main-form');

    if (landingNextBtn && landingStep && mainForm) {
        landingNextBtn.addEventListener('click', function() {
            // Hide landing step
            landingStep.style.display = 'none';
            
            // Show main form
            mainForm.style.display = 'block';
            
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
});
