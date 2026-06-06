from django import forms

from .models import *


class brandForm(forms.ModelForm):
    class Meta:
        fields = '__all__'
        model = brandModel

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['brand_name'].widget.attrs.update({
            'class': 'form-control',
            'placeholder': 'Enter brand name',
        })
