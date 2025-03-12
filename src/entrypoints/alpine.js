import Alpine from "alpinejs";
import persist from "@alpinejs/persist";
import intersect from "@alpinejs/intersect";
import morph from "@alpinejs/morph";
import focus from '@alpinejs/focus'

Alpine.plugin(persist);
Alpine.plugin(intersect);
Alpine.plugin(morph);
Alpine.plugin(focus);

window.Log = (...args) => {
  window.Luca && Luca.debug && console.log(...args);
};

Alpine.$dispatch = (event, detail = {}) => {
  document.dispatchEvent(
    new CustomEvent(event, {
      detail,
      bubbles: true,
      composed: true,
      cancelable: true,
    })
  );
};

Alpine.store("shopify", {
  init() {
    window.Luca && !Luca.storeId && this.check(window.Shop.shopify);
  },
  check(shopify) {
    return fetch(`${Luca.apiUrl}/stores/${shopify}`, {
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(response => {
        return response.json();
      })
      .then(response => {
        Luca.storeId = response.id;
      })
      .catch((error) => {
        console.error("Shopify Check:", error);
      });
  },
});

Alpine.store("customer", {
  create(customer) {
    return fetch(`${Luca.apiUrl}/customers`, {
      method: "POST",
      body: JSON.stringify({ customer, store: Luca.storeId }),
      headers: {
        "Content-Type": "application/json",
      },
    }).catch((error) => {
      console.error("Create Customer:", error);
    });
  },
  update(customer) {
    return fetch(`${Luca.apiUrl}/customers`, {
      method: "PUT",
      body: JSON.stringify({ customer, store: Luca.storeId }),
      headers: {
        "Content-Type": "application/json",
      },
    }).catch((error) => {
      console.error("Update Customer:", error);
    });
  },
});

Alpine.store("cart", {
  items: [],
  itemsCount: 0,
  init() {
    window.Luca && this.fetchItems();
  },
  checkAvailability(response) {
    let { status, message, description } = response;

    if (status !== undefined && status !== 200) {
      if (description === undefined) {
        description = message;
        message = "Erro de carrinho";
      }

      Alpine.$dispatch("show-notification", {
        type: "error",
        title: message,
        description,
      });
    }

    return response;
  },
  addItems(items, options = {}) {
    return fetch("/cart/add.js", {
      method: "POST",
      body: JSON.stringify({ items: items }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(response => {
        return response.json();
      })
      .then(response => {
        const { status } = response;

        if (status !== undefined && status !== 200) {
          return this.checkAvailability(response);
        }

        if (options.showCart || options.showCart === undefined) {
          Alpine.$dispatch("show-cart");
        }

        return response;
      })
      .catch((error) => {
        console.error("Add to Cart:", error);
      });
  },
  updateItems(items) {
    return fetch("/cart/update.js", {
      method: "POST",
      body: JSON.stringify({ updates: items }),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(response => {
        return response.json();
      })
      .then(response => {
        const { status } = response;

        if (status === 200) {
          this.refresh(response.item_count, response.items);
        }

        Alpine.$dispatch("cart-change");

        return response;
      })
      .catch((error) => {
        console.error("Update Items Cart:", error);
      });
  },
  updateItem(item) {
    const currentItem = this.items.find((i) => i.key === item.id);

    if(currentItem.properties?.Kit) {
      const sameKitItems = {};

      for (const sameKitItem of this.items.filter((i) => i.properties && i.properties.Kit === currentItem.properties.Kit)) {
        sameKitItems[sameKitItem.key] = item.quantity;
      }

      return this.updateItems(sameKitItems);
    }

    return fetch("/cart/change.js", {
      method: "POST",
      body: JSON.stringify(item),
      headers: {
        "Content-Type": "application/json",
      },
    })
      .then(response => {
        return response.json();
      })
      .then(response => {
        const { status } = response;

        if (status !== undefined && status !== 200) {
          Alpine.$dispatch("cart-change");

          return this.checkAvailability(response);
        }

        this.refresh(response.item_count, response.items);
        Alpine.$dispatch("cart-change");

        return response;
      })
      .catch((error) => {
        console.error("Update Cart Item:", error);
      });
  },
  refresh(itemsCount, items) {
    this.itemsCount = itemsCount;
    this.items = items;
  },
  fetchItems() {
    fetch("/cart.js")
      .then(response => {
        return response.json();
      })
      .then(response => {
        this.refresh(response.item_count, response.items);
        Alpine.$dispatch("cart-change");
      })
      .catch((error) => {
        console.error("Fetch Cart:", error);
      });
  },
});

Alpine.data("newsletter", () => ({
  loading: false,
  name: "",
  email: "",
  tags: "newsletter",
  subscribe() {
    const customer = {
      first_name: this.name,
      email: this.email,
      accepts_sms: true,
      accepts_marketing: true,
      tags: this.tags,
    };

    if (!customer.email) {
      return;
    }

    this.loading = true;

    Alpine.store("customer")
      .create(customer)
      .then(response => {
        this.loading = false;

        if (response.status === 204 || response.status === 422) {
          this.name = "";
          this.email = "";

          Alpine.$dispatch("show-notification", Shop.locales.newsletter.success);
        } else {
          Alpine.$dispatch("show-notification", Shop.locales.newsletter.error);
        }
      })
      .catch((error) => {
        this.loading = false;

        Alpine.$dispatch("show-notification", Shop.locales.newsletter.error);
      });
  },
}));

Alpine.start();

window.Alpine = Alpine;
