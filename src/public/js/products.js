document.addEventListener('DOMContentLoaded', async () => {
    const productsContainer = document.getElementById('products-container');
    const cartId = document.body.dataset.cartId;
    const userRole = document.body.dataset.userRole; // Obtener el rol del usuario

    // Elementos del modal
    const editProductModal = document.getElementById('editProductModal');
    const closeButton = editProductModal.querySelector('.close-button');
    const editProductForm = document.getElementById('editProductForm');
    const editProductId = document.getElementById('editProductId');
    const editTitle = document.getElementById('editTitle');
    const editDescription = document.getElementById('editDescription');
    const editPrice = document.getElementById('editPrice');
    const editStock = document.getElementById('editStock');
    const editCategory = document.getElementById('editCategory');
    const editCode = document.getElementById('editCode');
    const editThumbnail = document.getElementById('editThumbnail');

    // Función global para actualizar el contador del carrito en el header
    window.updateCartItemCount = async () => {
        const cartItemCountSpan = document.getElementById('cart-item-count');
        if (cartItemCountSpan && cartId && cartId !== 'null') {
            try {
                const response = await fetch(`/api/carts/${cartId}`);
                if (response.ok) {
                    const data = await response.json();
                    const totalItems = data.payload.products.reduce((sum, item) => sum + item.quantity, 0);
                    cartItemCountSpan.textContent = totalItems;
                } else {
                    console.error('Error al obtener el carrito para el contador:', response.statusText);
                    cartItemCountSpan.textContent = '0';
                }
            } catch (error) {
                console.error('Error de red al obtener el carrito para el contador:', error);
                cartItemCountSpan.textContent = '0';
            }
        } else if (cartItemCountSpan) {
            cartItemCountSpan.textContent = '0';
        }
    };

    async function fetchProducts() {
        try {
            const response = await fetch('/api/products', {
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
                    <div class="quantity-control">
                        <label for="quantity-${product._id}">Cantidad:</label>
                        <input type="number" id="quantity-${product._id}" class="product-quantity-input" value="1" min="1" max="${product.stock}" style="width: 60px; text-align: center;">
                    </div>
                    <button class="add-to-cart-btn" data-product-id="${product._id}">Agregar al Carrito</button>
                    ${userRole === 'admin' ? `<button class="edit-product-btn" data-product-id="${product._id}">Editar</button>` : ''}
                `;
                productsContainer.appendChild(productCard);
            });

            attachAddToCartListeners();
            attachEditProductListeners(); // Adjuntar listeners para los botones de edición
            window.updateCartItemCount(); // Actualizar el contador al cargar los productos
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
                const quantityInput = document.getElementById(`quantity-${productId}`);
                const quantity = parseInt(quantityInput.value, 10);

                if (!productId) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error de Producto',
                        text: 'No se pudo obtener el ID del producto.'
                    });
                    return;
                }

                if (isNaN(quantity) || quantity < 1) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Cantidad Inválida',
                        text: 'Por favor, ingresa una cantidad válida (mínimo 1).'
                    });
                    return;
                }

                if (!cartId || cartId === 'null') {
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
                        body: JSON.stringify({ quantity: quantity })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        Swal.fire({
                            icon: 'success',
                            title: '¡Producto Agregado!',
                            text: data.message || `Se añadieron ${quantity} unidades de este producto al carrito.`,
                            showConfirmButton: false,
                            timer: 1500
                        });
                        // Actualizar el contador del carrito usando cartCount de la respuesta
                        const cartItemCountSpan = document.getElementById('cart-item-count');
                        if (cartItemCountSpan && data.cartCount !== undefined) {
                            cartItemCountSpan.textContent = data.cartCount;
                        }
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

    // --- Funcionalidad de Edición para Admin---
    function attachEditProductListeners() {
        const editButtons = document.querySelectorAll('.edit-product-btn');
        editButtons.forEach(button => {
            button.addEventListener('click', async (event) => {
                const productId = event.target.dataset.productId;
                try {
                    const response = await fetch(`/api/products/${productId}`);
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Error al obtener los datos del producto para edición.');
                    }
                    const data = await response.json();
                    const product = data.payload;

                    // Cargar datos en el formulario del modal
                    editProductId.value = product._id;
                    editTitle.value = product.title;
                    editDescription.value = product.description;
                    editPrice.value = product.price;
                    editStock.value = product.stock;
                    editCategory.value = product.category;
                    editCode.value = product.code;
                    editThumbnail.value = product.thumbnail || '';

                    editProductModal.style.display = 'block'; // Mostrar el modal

                } catch (error) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error de Edición',
                        text: error.message || 'No se pudo cargar el producto para edición.'
                    });
                    console.error('Error al cargar producto para edición:', error);
                }
            });
        });
    }

    // Cerrar modal
    closeButton.addEventListener('click', () => {
        editProductModal.style.display = 'none';
    });

    window.addEventListener('click', (event) => {
        if (event.target === editProductModal) {
            editProductModal.style.display = 'none';
        }
    });

    // Enviar formulario de edición
    editProductForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const productId = editProductId.value;
        const updatedData = {
            title: editTitle.value,
            description: editDescription.value,
            price: parseFloat(editPrice.value),
            stock: parseInt(editStock.value, 10),
            category: editCategory.value,
            thumbnail: editThumbnail.value
        };

        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedData)
            });

            const data = await response.json();

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Producto Actualizado!',
                    text: data.message || 'El producto ha sido actualizado exitosamente.',
                    showConfirmButton: false,
                    timer: 1500
                }).then(() => {
                    editProductModal.style.display = 'none';
                    fetchProducts(); // Recargar la lista de productos para ver los cambios
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error al Actualizar',
                    text: data.message || 'No se pudo actualizar el producto.'
                });
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Error de Conexión',
                text: 'No se pudo conectar al servidor para actualizar el producto.',
            });
            console.error('Error de red al actualizar producto:', error);
        }
    });
});
