function mostrarSenha() {
    document.getElementById('login-password').type = 'text';
}

function ocultarSenha() {
    document.getElementById('login-password').type = 'password';
}

function setupPasswordToggle() {
    const passwordField = document.getElementById('login-password');
    if (!passwordField) {
        return;
    }
    const eyeButton = document.getElementById('olho');
    const originalIcon = eyeButton.src;
    const toggledIcon = 'https://cdn-icons-png.flaticon.com/512/565/565655.png';
    let isPasswordVisible = false;
    eyeButton.onmousedown = null;
    eyeButton.onmouseup = null;

    eyeButton.addEventListener('click', () => {
        isPasswordVisible = !isPasswordVisible;

        if (isPasswordVisible) {
            mostrarSenha();
            eyeButton.src = toggledIcon;
        } else {
            ocultarSenha();
            eyeButton.src = originalIcon;
        }
    });

    passwordField.addEventListener('blur', () => {
        if (isPasswordVisible) {
            ocultarSenha();
            eyeButton.src = originalIcon;
            isPasswordVisible = false;
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    setupPasswordToggle();
});