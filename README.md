# CRUD Dashboard Twig (Frontend)
This package is a sub-package of [dakataa/crud](https://github.com/dakataa/crud) and depending on it.
Create beautiful CRUD Dashboard with no effort.
You can customize colors, logo, icons, and also you can easy extends or change the **Templates** or **Bootstrap Theme**.

## Setup
### Install packages
```shell
composer require dakataa/crud-twig
```


## Twig

### Methods
| Method               | Description                                                              |
|----------------------|--------------------------------------------------------------------------|
| getRoute(name)       | Get Route by Action name or Controller Method name if action has no name |
| generatePath         | Generate URL Path by Action Name                                         |
| generatePathByAction | Generate URL Path by Action                                              |
| hasAction            | Check for existing action by name                                        |

### Component (Twig Macros)
Available Blocks

| Component | Description                                     |
|-----------|-------------------------------------------------|
| GridView  | The GridView is used to display data in a grid. |

### How to extend or change the templates

You can easy extend every `list`, `edit`, `view` template by creating a new template in root project dir
`templates/crud/[entity]/[template].html.twig`

```php
{% extends '@DakataaCrudTwig/edit.html.twig' %}
{% block title %}
	New Title
{% endblock}

{% block form_start %}
	Before Form Begin
   {{ parent() }}
{% endblock %}

{% block form_body %}
	{{ form_row(form.modify.view.name) }}
	<hr>
	{{ form_rest(form.modify.view) }}
{% endblock %}
```


# Javascript API
### Data Fetcher

### Ajax Validator
Validate and Display form errors without refreshing.
Just add HTML attribute `[data-ajax]`
```html
<form data-ajax="true" action="..." method="...">
	...
</form>
```
