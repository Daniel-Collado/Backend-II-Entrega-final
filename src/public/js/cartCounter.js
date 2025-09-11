// public/js/cartCounter.js
window.updateCartItemCount = async () => {
    try {
        const cartItemCountSpan = document.getElementById('cart-item-count');
        const cartId = document.body.dataset.userCartId;
        if (!cartItemCountSpan) return;
        if (!cartId || cartId === 'null' || cartId === '') {
        cartItemCountSpan.textContent = '0';
        return;
        }

        const res = await fetch(`/api/carts/${cartId}`);
        if (!res.ok) {
        cartItemCountSpan.textContent = '0';
        return;
        }
        const data = await res.json();
        const totalItems = (data.payload?.products || []).reduce((s, it) => s + (it.quantity || 0), 0);
        cartItemCountSpan.textContent = totalItems;
    } catch (err) {
        console.error('updateCartItemCount error:', err);
        const cartItemCountSpan = document.getElementById('cart-item-count');
        if (cartItemCountSpan) cartItemCountSpan.textContent = '0';
    }
    };

    document.addEventListener('DOMContentLoaded', () => {
    if (typeof window.updateCartItemCount === 'function') window.updateCartItemCount();
    });
