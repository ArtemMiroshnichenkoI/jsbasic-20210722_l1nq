import createElement from '../../assets/lib/create-element.js';
import escapeHtml from '../../assets/lib/escape-html.js';

import Modal from '../../7-module/2-task/index.js';

export default class Cart {
  cartItems = []; // [product: {...}, count: N]

  constructor(cartIcon) {
    this.cartIcon = cartIcon;

    this.addEventListeners();
  }

  addProduct(product) {
    if (product != null) {
      if (this.cartItems.length > 0) {
        let end = this.cartItems.length;
        let i = 0;
        while (i < end) {
          if (i != end && this.cartItems[i]["product"] == product) {
            this.cartItems[i].count += 1;
            break;
          } else if (i + 1 == end) {
            this.cartItems.push({"product": product, "count": 1 });
          }
          i++;
        }
      } else {
        this.cartItems.push({"product": product, "count": 1 });
      }
    }
    this.onProductUpdate(this.cartItem); 
  }

  updateProductCount(productId, amount) {
    for (let i of this.cartItems) {
      if (i.product.id == productId) {
        i.count += amount;
        if (i.count == 0) {
          this.cartItems.splice(this.cartItems.indexOf(i), 1);
          if (document.body.classList.contains("is-modal-open")) {
            document.querySelector(`[data-product-id=${i.product.id}]`).remove();
          }
        }
      }
    }
    this.onProductUpdate(this.cartItems);
  }

  isEmpty() {
    if (this.cartItems.length > 0) {
      return false;
    } else {
      return true;
    }
  }

  getTotalCount() {
    let count = 0;
    for (let i of this.cartItems) {
      count += i.count;
    }
    return count;
  }

  getTotalPrice() {
    let priceAll = 0;
    for (let i of this.cartItems) {
      priceAll += i.count * i.product.price;
    }
    return priceAll;
  }

  renderProduct(product, count) {
    return createElement(`
    <div class="cart-product" data-product-id="${product.id}">
      <div class="cart-product__img">
        <img src="/assets/images/products/${product.image}" alt="product">
      </div>
      <div class="cart-product__info">
        <div class="cart-product__title">${escapeHtml(product.name)}</div>
        <div class="cart-product__price-wrap">
          <div class="cart-counter">
            <button type="button" class="cart-counter__button cart-counter__button_minus">
              <img src="/assets/images/icons/square-minus-icon.svg" alt="minus">
            </button>
            <span class="cart-counter__count">${count}</span>
            <button type="button" class="cart-counter__button cart-counter__button_plus">
              <img src="/assets/images/icons/square-plus-icon.svg" alt="plus">
            </button>
          </div>
          <div class="cart-product__price">€${product.price.toFixed(2)}</div>
        </div>
      </div>
    </div>`);
  }

  renderOrderForm() {
    return createElement(`<form class="cart-form">
      <h5 class="cart-form__title">Delivery</h5>
      <div class="cart-form__group cart-form__group_row">
        <input name="name" type="text" class="cart-form__input" placeholder="Name" required value="Santa Claus">
        <input name="email" type="email" class="cart-form__input" placeholder="Email" required value="john@gmail.com">
        <input name="tel" type="tel" class="cart-form__input" placeholder="Phone" required value="+1234567">
      </div>
      <div class="cart-form__group">
        <input name="address" type="text" class="cart-form__input" placeholder="Address" required value="North, Lapland, Snow Home">
      </div>
      <div class="cart-buttons">
        <div class="cart-buttons__buttons btn-group">
          <div class="cart-buttons__info">
            <span class="cart-buttons__info-text">total</span>
            <span class="cart-buttons__info-price">€${this.getTotalPrice().toFixed(2)}</span>
          </div>
          <button type="submit" class="cart-buttons__button btn-group__button button">order</button>
        </div>
      </div>
    </form>`);
  }

  renderModal() {
    this.modal = new Modal();
    this.modal.setTitle('Your order');
    let divBody = createElement("<div> </div>");

    for (let i of this.cartItems) {
      divBody.append(this.renderProduct(i.product, i.count));
    }
    divBody.append(this.renderOrderForm());
    this.modal.setBody(divBody);
    this.modal.open();

    document.querySelectorAll(".cart-product").forEach((item) => {
      item.addEventListener("click", (event) => {
        if (event.target.closest('.cart-counter__button_minus')) {
          this.updateProductCount(event.currentTarget.dataset.productId, -1);
        } else if (event.target.closest('.cart-counter__button_plus')) {
          this.updateProductCount(event.currentTarget.dataset.productId, 1);
        }
      });
    });

    document.querySelector(".cart-form").addEventListener("submit", (event) => this.onSubmit(event));
  }

  onProductUpdate(cartItem) {
    if (document.body.classList.contains("is-modal-open")) {
      for (let i of cartItem) {
        let productId = i.product.id;
        let modalBody = document.querySelector('.modal');
        let productCount = modalBody.querySelector(`[data-product-id="${productId}"] .cart-counter__count`);
        let productPrice = modalBody.querySelector(`[data-product-id="${productId}"] .cart-product__price`);
        let infoPrice = modalBody.querySelector(`.cart-buttons__info-price`);
        productCount.innerHTML = i.count;
        productPrice.innerHTML = `€${(i.product.price * i.count).toFixed(2)}`;
        infoPrice.innerHTML = `€${this.getTotalPrice().toFixed(2)}`;
      }
      if (cartItem.length == 0) {
        this.modal.close();
      }
    }
    this.cartIcon.update(this);
  }

  onSubmit = async (event) => {
    event.preventDefault();
    document.querySelector("button[type=button]").classList.add("is-loading");

    await fetch('https://httpbin.org/post', {
      method: 'POST',
      body: new FormData(document.querySelector("form"))
    })
    .then(() => {
      this.modal.setTitle("Success!");
      this.modal.setBody(createElement(`
      <div class="modal__body-inner">
        <p>
          Order successful! Your order is being cooked :) <br>
          We’ll notify you about delivery time shortly.<br>
          <img src="/assets/images/delivery.gif">
        </p>
      </div>
      `));
      this.cartItems = [];
    });
  }

  addEventListeners() {
    this.cartIcon.elem.onclick = () => this.renderModal();
  }
}

