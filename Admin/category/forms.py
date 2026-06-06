from django import forms

from .models import categoryModel


class categoryForm(forms.ModelForm):
    class Meta:
        model = categoryModel
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['cat_name'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'Enter category name',
        })
        self.fields['cat_img'].widget.attrs.update({
            'class': 'form-control',
        })
