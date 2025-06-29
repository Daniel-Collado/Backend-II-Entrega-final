
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('create-product-form');

    if (form) {
        form.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(form);

            try {
                const response = await fetch('/api/products', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (response.ok) {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Éxito!',
                        text: data.message || 'Producto creado exitosamente.',
                        showConfirmButton: false,
                        timer: 2000
                    }).then(() => {
                        form.reset();
                    });
                    console.log('Producto creado:', data.product);
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: data.message || 'No se pudo crear el producto.',
                        footer: 'Inténtalo de nuevo o contacta al soporte.' 
                    });
                    console.error('Error al crear producto:', data);
                }
            } catch (error) {
                Swal.fire({ 
                    icon: 'error',
                    title: 'Error de conexión',
                    text: 'No se pudo conectar al servidor. Verifica tu conexión a internet.',
                });
                console.error('Error de red:', error);
            }
        });
    }
});