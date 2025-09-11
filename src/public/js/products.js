// src/public/js/products.js
document.addEventListener('DOMContentLoaded', async () => {
    const productsContainer = document.getElementById('products-container');
    const paginationControls = document.getElementById('pagination-controls');
    const cartId = document.body.dataset.userCartId;
    const userRole = document.body.dataset.userRole;
    const searchInput = document.getElementById('search-input');
    const categorySelect = document.getElementById('category-select');
    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');

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

    // Función para formatear texto
    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();


    // Función para actualizar la UI de paginación
    const updatePaginationControls = (page, totalPages) => {
        if (!paginationControls) return;
        paginationControls.innerHTML = ''; // Limpia los controles existentes

        if (totalPages > 1) {
            // Botón de página anterior
            const prevButton = document.createElement('button');
            prevButton.textContent = 'Anterior';
            prevButton.disabled = page === 1;
            prevButton.onclick = () => fetchProducts(searchInput.value, categorySelect.value, page - 1);
            paginationControls.appendChild(prevButton);

            // Indicador de página actual
            const pageSpan = document.createElement('span');
            pageSpan.textContent = `Página ${page} de ${totalPages}`;
            paginationControls.appendChild(pageSpan);

            // Botón de página siguiente
            const nextButton = document.createElement('button');
            nextButton.textContent = 'Siguiente';
            nextButton.disabled = page === totalPages;
            nextButton.onclick = () => fetchProducts(searchInput.value, categorySelect.value, page + 1);
            paginationControls.appendChild(nextButton);

            // 💡 Nuevo: Botón de última página (se añade si no es la última página)
            if (page < totalPages) {
                const lastPageButton = document.createElement('button');
                lastPageButton.textContent = 'Última';
                lastPageButton.onclick = () => fetchProducts(searchInput.value, categorySelect.value, totalPages);
                paginationControls.appendChild(lastPageButton);
            }
        }
    };

    // La función fetchProducts ahora recibe el número de página como parámetro
    async function fetchProducts(search = '', category = '', page = 1) {
        try {
            const query = new URLSearchParams();
            if (search.trim()) query.append('search', search.trim());
            if (category.trim()) query.append('category', category.trim());
            query.append('page', page);
            const url = `/api/products?${query.toString()}`;
            console.log('Enviando solicitud a:', url);

            const response = await fetch(url, {
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
            console.log('Respuesta de /api/products:', JSON.stringify(data, null, 2));
            const { products, categories, totalPages, prevPage, nextPage, page: currentPage, hasPrevPage, hasNextPage } = data.payload;

            // Llenar el desplegable de categorías
            categorySelect.innerHTML = '<option value="">Todas las categorías</option>';
            if (categories && Array.isArray(categories)) {
                categories.forEach(cat => {
                    const option = document.createElement('option');
                    option.value = cat;
                    option.textContent = capitalize(cat);
                    if (cat.toLowerCase() === category.toLowerCase()) option.selected = true;
                    categorySelect.appendChild(option);
                });
            } else {
                console.warn('No se recibieron categorías válidas:', categories);
            }

            // Limpiar contenedor de productos
            productsContainer.innerHTML = '';

            if (!products || products.length === 0) {
                productsContainer.innerHTML = '<p>No hay productos disponibles para los filtros seleccionados.</p>';
                paginationControls.innerHTML = ''; // Limpiar controles de paginación
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
                    <p><strong>Categoría:</strong> ${product.category.split(',').map(cat => capitalize(cat.trim())).join(', ')}</p>
                    ${product.thumbnail && product.thumbnail.length ?
                        `<img src="${product.thumbnail[0]}" alt="${product.title}" class="product-thumbnail">` :
                        `<img src="/img/default-product.png" alt="Producto sin imagen" class="product-thumbnail">`
                    }
                    <div class="quantity-control">
                        <label for="quantity-${product._id}">Cantidad:</label>
                        <input type="number" id="quantity-${product._id}" class="product-quantity-input" value="1" min="1" max="${product.stock}" style="width: 60px; text-align: center;">
                    </div>
                    <button class="add-to-cart-btn" data-product-id="${product._id}">Agregar al Carrito</button>
                    ${userRole === 'admin' ? `
                        <button class="edit-product-btn" data-product-id="${product._id}">Editar</button>
                        <button class="delete-btn" data-product-id="${product._id}">Eliminar</button>`
                    : ''}
                `;
                productsContainer.appendChild(productCard);
            });

            // Lógica para renderizar los controles de paginación
            renderPaginationControls({ totalPages, currentPage, hasPrevPage, hasNextPage, prevPage, nextPage });

            // Adjuntar listeners después de renderizar los productos
            attachEventListeners();

            // ahora usa la función global de cartCounter.js
            if (typeof window.updateCartItemCount === 'function') {
                window.updateCartItemCount();
            }
        } catch (error) {
            console.error('Hubo un error al cargar los productos:', error);
            productsContainer.innerHTML = `<p>Error al cargar los productos: ${error.message}</p>`;
            paginationControls.innerHTML = '';
        }
    }

    // Nueva función para generar los controles de paginación
    function renderPaginationControls({ totalPages, currentPage, hasPrevPage, hasNextPage, prevPage, nextPage }) {
        if (!paginationControls) return;
        
        paginationControls.innerHTML = ''; // Limpiar controles existentes
        
        // Botón Anterior
        const prevButton = document.createElement('button');
        prevButton.textContent = 'Anterior';
        prevButton.disabled = !hasPrevPage;
        if (hasPrevPage) {
            prevButton.addEventListener('click', () => {
                fetchProducts(searchInput.value, categorySelect.value, prevPage);
            });
        }
        paginationControls.appendChild(prevButton);
        
        // Información de la página
        const pageInfo = document.createElement('span');
        pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
        paginationControls.appendChild(pageInfo);

        // Botón Siguiente
        const nextButton = document.createElement('button');
        nextButton.textContent = 'Siguiente';
        nextButton.disabled = !hasNextPage;
        if (hasNextPage) {
            nextButton.addEventListener('click', () => {
                fetchProducts(searchInput.value, categorySelect.value, nextPage);
            });
        }
        paginationControls.appendChild(nextButton);

        // Botón de última página (se añade si no es la última página)
        if (currentPage < totalPages) {
            const lastPageButton = document.createElement('button');
            lastPageButton.textContent = 'Última';
            lastPageButton.addEventListener('click', () => {
                fetchProducts(searchInput.value, categorySelect.value, totalPages);
            });
            paginationControls.appendChild(lastPageButton);
        }
    }
    
    // Cargar productos al iniciar
    fetchProducts();

    // Evento para aplicar filtros
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            const searchValue = searchInput.value.trim();
            const categoryValue = categorySelect.value;
            console.log('Aplicando filtros:', { search: searchValue, category: categoryValue });
            fetchProducts(searchValue, categoryValue, 1); // Empezar en la página 1
        });
    } else {
        console.error('Botón apply-filters-btn no encontrado');
    }

    // Evento para resetear filtros
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            searchInput.value = '';
            categorySelect.value = '';
            console.log('Reseteando filtros');
            fetchProducts('', '', 1); // Empezar en la página 1
        });
    } else {
        console.error('Botón reset-filters-btn no encontrado');
    }

    // Filtrar al presionar Enter en el campo de búsqueda
    if (searchInput) {
        searchInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                const searchValue = searchInput.value.trim();
                const categoryValue = categorySelect.value;
                console.log('Filtrando con Enter:', { search: searchValue, category: categoryValue });
                fetchProducts(searchValue, categoryValue, 1); // Empezar en la página 1
            }
        });
    } else {
        console.error('Input search-input no encontrado');
    }

    function attachEventListeners() {
        // Adjuntar listeners para el botón de agregar al carrito
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
        
        // --- Funcionalidad de Edición para Admin ---
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

        // --- Funcionalidad de Eliminación para Admin ---
        const deleteButtons = document.querySelectorAll('.delete-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', async (event) => {
                const productId = event.target.dataset.productId;
                
                // Pide confirmación antes de eliminar
                const result = await Swal.fire({
                    title: '¿Estás seguro?',
                    text: '¡No podrás revertir esto!',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6',
                    confirmButtonText: 'Sí, eliminarlo',
                    cancelButtonText: 'Cancelar'
                });

                if (result.isConfirmed) {
                    try {
                        const response = await fetch(`/api/products/${productId}`, {
                            method: 'DELETE'
                        });

                        const data = await response.json();

                        if (response.ok) {
                            Swal.fire(
                                '¡Eliminado!',
                                'El producto ha sido eliminado.',
                                'success'
                            );
                            // Recarga la lista de productos para actualizar la vista
                            fetchProducts(searchInput.value.trim(), categorySelect.value);
                        } else {
                            Swal.fire(
                                'Error',
                                data.message || 'No se pudo eliminar el producto.',
                                'error'
                            );
                        }
                    } catch (error) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error de Conexión',
                            text: 'No se pudo conectar al servidor para eliminar el producto.'
                        });
                        console.error('Error de red al eliminar producto:', error);
                    }
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

    editProductForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const productId = editProductId.value;
        const updatedData = {
            title: editTitle.value,
            description: editDescription.value,
            price: parseFloat(editPrice.value),
            stock: parseInt(editStock.value, 10),
            category: editCategory.value,
            thumbnail: editThumbnail.value ? [editThumbnail.value] : []
        };

        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
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
                    // Recargar productos con los filtros y página actuales
                    fetchProducts(searchInput.value.trim(), categorySelect.value, data.payload.page);
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
                text: 'No se pudo conectar al servidor para actualizar el producto.'
            });
            console.error('Error de red al actualizar producto:', error);
        }
    });
});