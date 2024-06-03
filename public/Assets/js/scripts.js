document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed");

    // Check if the current page has sign-in form elements
    const signInButton = document.getElementById('signin-btn');
    const emailInput = document.getElementById('signin-email');
    const passwordInput = document.getElementById('signin-password');

    if (signInButton && emailInput && passwordInput) {
        console.log("Sign In form elements found");

        // signInButton.addEventListener('click', (event) => {
        //     event.preventDefault();  // Prevent default form submission
        //     console.log("Sign In button clicked");

        //     const email = emailInput.value;
        //     const password = passwordInput.value;

        //     console.log(`Email: ${email}, Password: ${password}`);

        //     // Mocking a successful sign-in process.
        //     // In a real scenario, you would perform form validation and send a request to the server.
        //     if (email && password) {
        //         localStorage.setItem('isSignedIn', 'true');
        //         localStorage.setItem('profilePic', 'public/Assets/images/other.jpg'); // Assuming a static profile picture for now

        //         // Assuming sign-in is successful, redirect to action.html
        //         window.location.href = 'action.html';
        //     } else {
        //         alert("Please enter email and password");
        //     }
        // });
    } else {
        console.log("Sign In form elements not found, not on form.html");
    }

    // Check if the current page is action.html
    const signInNavItem = document.getElementById('signin-nav-item');
    const profilePic = document.getElementById('profile-pic');
    const logoutBtn = document.getElementById("logoutBtn")

    if (signInNavItem && profilePic) {
        console.log("Navbar elements found on action.html");

        // Check if user is signed in
        const isSignedIn = localStorage.getItem('isSignedIn') === 'true';
        console.log(`isSignedIn: ${isSignedIn}`);

        if (isSignedIn) {
            console.log("User is signed in, updating UI");
            signInNavItem.style.display = 'none'; // Hide the sign-in nav item
            profilePic.src = localStorage.getItem('profilePic');
            profilePic.classList.remove('d-none');   // Show the profile picture
            logoutBtn.classList.remove("d-none")
        } else {
            console.log("User is not signed in");
            signInNavItem.style.display = ''; // Show the sign-in nav item
            profilePic.classList.add('d-none');   // Hide the profile picture
            signInButton.classList.add('d-none')
        }
    } else {
        console.log("Navbar elements not found, not on action.html");
    }

    logoutBtn.addEventListener("click",()=>{
        localStorage.setItem("isSignedIn","false");
        signInNavItem.style.display = ''; // Show the sign-in nav item
         profilePic.classList.add('d-none');   // Hide the profile picture
        signInButton.classList.add('d-none')
        logoutBtn.classList.add("d-none")
    })
});

