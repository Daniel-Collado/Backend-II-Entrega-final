
document.addEventListener('DOMContentLoaded', async () => {
    const productsContainer = document.getElementById('products-container');

    // Obtener el cartId 
    const cartId = document.body.dataset.cartId;
    //console.log("Cart ID obtenido del DOM:", cartId); 

    async function fetchProducts() {
        try {
            const response = await fetch('http://localhost:8080/api/products', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 403) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Acceso Denegado',
                        text: 'No tenés permiso para ver los productos. Por favor, iniciá sesión.',
                        footer: '<a href="/login">Iniciá sesión</a>'
                    });
                    productsContainer.innerHTML = '<p>No tenés permiso para ver los productos. Por favor, <a href="/login">iniciá sesión</a>.</p>';
                    return;
                }
                const errorData = await response.json();
                Swal.fire({
                    icon: 'error',
                    title: 'Error al cargar',
                    text: errorData.message || 'Error al cargar los productos.'
                });
                throw new Error(errorData.message || 'Error al cargar los productos');
            }

            const data = await response.json();
            const products = data.payload;

            productsContainer.innerHTML = '';

            if (products.length === 0) {
                productsContainer.innerHTML = '<p>No hay productos disponibles en este momento.</p>';
                return;
            }

            products.forEach(product => {
                const productCard = document.createElement('div');
                productCard.classList.add('product-card');

                productCard.innerHTML = `
                    <h3>${product.title}</h3>
                    <p><strong>Artista/Descripción:</strong> ${product.description}</p>
                    <p><strong>Código:</strong> ${product.code}</p>
                    <p><strong>Precio:</strong> $${product.price}</p>
                    <p><strong>Stock:</strong> ${product.stock}</p>
                    <p><strong>Categoría:</strong> ${product.category}</p>
                    ${product.thumbnail ?
                        `<img src="${product.thumbnail}" alt="${product.title}" class="product-thumbnail">` :
                        `<img src="/img/default-product.png" alt="Producto sin imagen" class="product-thumbnail">`
                    }
                    <button class="add-to-cart-btn" data-product-id="${product._id}">Agregar al Carrito</button>
                `;
                productsContainer.appendChild(productCard);
            });

            attachAddToCartListeners();

        } catch (error) {
            console.error('Hubo un error al cargar los productos:', error);
            productsContainer.innerHTML = `<p>Error al cargar los productos: ${error.message}</p>`;
        }
    }

    fetchProducts();

    function attachAddToCartListeners() {
        const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');

        addToCartButtons.forEach(button => {
            button.addEventListener('click', async (event) => {
                const productId = event.target.dataset.productId;

                if (!productId) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error de Producto',
                        text: 'No se pudo obtener el ID del producto.'
                    });
                    return;
                }

                if (!cartId || cartId === 'null') { // Verificar si cartId es null o el placeholder
                    Swal.fire({
                        icon: 'warning',
                        title: 'Carrito no disponible',
                        text: 'No se pudo obtener el ID del carrito. ¿Estás logueado? Asegúrate de que el carrito se genere para el usuario.',
                        footer: '<a href="/login">Iniciá sesión para tener un carrito</a>'
                    });
                    return;
                }

                try {
                    const response = await fetch(`/api/carts/${cartId}/products/${productId}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ quantity: 1 })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        Swal.fire({
                            icon: 'success',
                            title: '¡Producto Agregado!',
                            text: data.message || 'El producto se añadió al carrito.',
                            showConfirmButton: false,
                            timer: 1500
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error al Añadir',
                            text: data.message || 'No se pudo añadir el producto al carrito.',
                            footer: 'Verifica stock o permisos.'
                        });
                    }
                } catch (error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error de Conexión',
                        text: 'No se pudo conectar al servidor para añadir al carrito.',
                    });
                    console.error('Error de red al añadir al carrito:', error);
                }
            });
        });
    }
});