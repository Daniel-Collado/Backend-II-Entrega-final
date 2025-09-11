document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.updateCartItemCount === 'function') {
        window.updateCartItemCount();
    }

    const completePurchaseBtn = document.getElementById('complete-purchase-btn');
    const clearCartBtn = document.getElementById('clear-cart-btn');
    const removeButtons = document.querySelectorAll('.remove-from-cart-btn');
    const cartTotalEl = document.getElementById('cart-total');
    const cartGrid = document.querySelector('.cart-products-grid');

    // Completar compra
    if (completePurchaseBtn) {
        completePurchaseBtn.addEventListener('click', async () => {
            const cartId = completePurchaseBtn.dataset.cartId;
            Swal.fire({
                title: '¿Estás seguro de completar la compra?',
                text: "¡No podrás revertir esto!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, ¡comprar!',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const response = await fetch(`/api/carts/${cartId}/purchase`, { method: 'POST' });
                        const data = await response.json();

                        if (response.ok) {
                            Swal.fire(
                                '¡Compra Realizada!',
                                data.message || 'Tu compra ha sido procesada exitosamente.',
                                'success'
                            ).then(() => {
                                if (typeof window.updateCartItemCount === 'function') {
                                    window.updateCartItemCount();
                                }
                                if (data.payload?.ticket?.code) {
                                    window.location.href = `/ticket/${data.payload.ticket.code}`;
                                } else {
                                    // Vaciar DOM del carrito
                                    if (cartGrid) cartGrid.innerHTML = '<p>Tu carrito está vacío.</p>';
                                    if (cartTotalEl) cartTotalEl.textContent = '0.00';
                                }
                            });
                        } else {
                            Swal.fire('Error en la compra', data.message || '', 'error');
                        }
                    } catch (error) {
                        console.error('Error de red al completar la compra:', error);
                        Swal.fire('Error de Conexión', 'No se pudo conectar al servidor.', 'error');
                    }
                }
            });
        });
    }

    // Vaciar carrito
    if (clearCartBtn) {
        clearCartBtn.addEventListener('click', async () => {
            const cartId = clearCartBtn.dataset.cartId;
            Swal.fire({
                title: '¿Estás seguro de vaciar el carrito?',
                text: "¡Esto eliminará todos los productos de tu carrito!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, ¡vaciar!',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const response = await fetch(`/api/carts/${cartId}`, { method: 'DELETE' });
                        const data = await response.json();

                        if (response.ok) {
                            Swal.fire(
                                '¡Carrito Vaciado!',
                                data.message || 'Tu carrito ha sido vaciado exitosamente.',
                                'success'
                            ).then(() => {
                                if (cartGrid) cartGrid.innerHTML = '<p>Tu carrito está vacío.</p>';
                                if (cartTotalEl) cartTotalEl.textContent = '0.00';
                                if (typeof window.updateCartItemCount === 'function') {
                                    window.updateCartItemCount();
                                }
                            });
                        } else {
                            Swal.fire('Error al vaciar', data.message || '', 'error');
                        }
                    } catch (error) {
                        console.error('Error de red al vaciar el carrito:', error);
                        Swal.fire('Error de Conexión', 'No se pudo conectar al servidor.', 'error');
                    }
                }
            });
        });
    }

    // Eliminar producto individual
    removeButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            const cartId = event.target.dataset.cartId;
            const productId = event.target.dataset.productId;

            Swal.fire({
                title: '¿Estás seguro?',
                text: "¡Este producto será eliminado de tu carrito!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, eliminarlo!',
                cancelButtonText: 'Cancelar'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        const response = await fetch(`/api/carts/${cartId}/products/${productId}`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' }
                        });
                        const data = await response.json();

                        if (response.ok) {
                            Swal.fire(
                                '¡Eliminado!',
                                data.message || 'El producto ha sido eliminado de tu carrito.',
                                'success'
                            ).then(() => {
                                // Quitar el producto del DOM
                                const productCard = event.target.closest('.cart-product-card');
                                if (productCard) productCard.remove();

                                // Recalcular total
                                if (cartGrid && cartGrid.children.length === 0) {
                                    cartGrid.innerHTML = '<p>Tu carrito está vacío.</p>';
                                    if (cartTotalEl) cartTotalEl.textContent = '0.00';
                                } else if (cartTotalEl) {
                                    // recalcular sumando subtotales
                                    let newTotal = 0;
                                    document.querySelectorAll('.cart-product-card').forEach(card => {
                                        const price = parseFloat(card.querySelector('p:nth-of-type(1)').textContent.replace(/[^0-9.-]+/g, "")) || 0;
                                        const qty = parseInt(card.querySelector('p:nth-of-type(2)').textContent.replace(/[^0-9]/g, "")) || 0;
                                        newTotal += price * qty;
                                    });
                                    cartTotalEl.textContent = newTotal.toFixed(2);
                                }

                                // Actualizar contador global
                                if (typeof window.updateCartItemCount === 'function') {
                                    window.updateCartItemCount();
                                }
                            });
                        } else {
                            Swal.fire('Error al eliminar', data.message || '', 'error');
                        }
                    } catch (error) {
                        console.error('Error de red al eliminar producto:', error);
                        Swal.fire('Error de Conexión', 'No se pudo conectar al servidor.', 'error');
                    }
                }
            });
        });
    });
});
