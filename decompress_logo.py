import gzip
import shutil

# Descomprimir SVGZ a SVG
with gzip.open(r'c:\Users\Carloncho\Desktop\carlonchito.svgz', 'rb') as f_in:
    with open(r'c:\Users\Carloncho\Desktop\CarlonchoApp\carlonchoapp\public\carloncho-logo.svg', 'wb') as f_out:
        shutil.copyfileobj(f_in, f_out)

print('Logo CARLONCHO descomprimido exitosamente!')
