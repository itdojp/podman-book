# {{ book.title }}

{{ book.subtitle }}

## 概要

{{ book.description }}

## 目次

- [はじめに](introduction/)
{% for chapter in chapters %}
- [{{ chapter.title }}]({{ chapter.path }})
{% endfor %}
{% if appendices.length > 0 %}

### 付録

{% for appendix in appendices %}
- [{{ appendix.title }}]({{ appendix.path }})
{% endfor %}
{% endif %}
{% if afterword %}
- [あとがき](afterword/)
{% endif %}

## 著者について

**{{ book.author.name }}**

{% if book.author.organization %}
{{ book.author.organization }}
{% endif %}

{% if book.author.email %}
- Email: [{{ book.author.email }}](mailto:{{ book.author.email }})
{% endif %}
{% if book.author.github %}
- GitHub: [@{{ book.author.github }}](https://github.com/{{ book.author.github }})
{% endif %}
{% if book.author.website %}
- Website: [{{ book.author.website }}]({{ book.author.website }})
{% endif %}

## ライセンス

{% if book.license %}
{{ book.license }}
{% else %}
© 2025 {{ book.author.name }}. All rights reserved.
{% endif %}

---

Built with [Book Publishing Template v3.0](https://github.com/itdojp/book-publishing-template2)