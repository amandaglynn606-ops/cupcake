"""Non-generative photo masking. GrabCut uses colour segmentation, not generated pixels.
Original photos are retained; only the background and output framing change.
"""
import json, pathlib, sys
import cv2
import numpy as np
from PIL import Image, ImageOps

ROOT=pathlib.Path(__file__).resolve().parents[1]
rows=json.loads((ROOT/'data/verified-selection.json').read_text())
specs=json.loads((ROOT/'data/photo-masks.json').read_text())
out=ROOT/'assets'/'catalogue'; out.mkdir(exist_ok=True)
for key,spec in specs.items():
    if len(sys.argv)>1 and key not in sys.argv[1:]: continue
    row=rows[int(key)-1]
    photo=ImageOps.exif_transpose(Image.open(ROOT/row['image'])).convert('RGB')
    photo.thumbnail((1200,1200))
    pixels=np.array(photo); h,w=pixels.shape[:2]
    polygon=np.array([[round(x*w/100),round(y*h/100)] for x,y in spec['polygon']],np.int32)
    silhouette=np.zeros((h,w),np.uint8)
    cv2.fillPoly(silhouette,[polygon],255)
    # The hand-reviewed silhouette defines the cake; refinement is confined to its edge.
    margin=max(2,round(min(h,w)*spec.get('edge',.08)))
    kernel=cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(margin*2+1,margin*2+1))
    inner=cv2.erode(silhouette,kernel)
    outer=cv2.dilate(silhouette,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(max(3,round(min(h,w)*.05))|1,)*2))
    mask=np.full((h,w),cv2.GC_BGD,np.uint8)
    mask[outer>0]=cv2.GC_PR_BGD
    mask[silhouette>0]=cv2.GC_PR_FGD
    mask[inner>0]=cv2.GC_FGD
    for points in spec.get('include',[]):
        cv2.fillPoly(mask,[np.array([[round(x*w/100),round(y*h/100)] for x,y in points],np.int32)],cv2.GC_FGD)
    for points in spec.get('exclude',[]):
        cv2.fillPoly(mask,[np.array([[round(x*w/100),round(y*h/100)] for x,y in points],np.int32)],cv2.GC_BGD)
    cv2.grabCut(pixels,mask,None,np.zeros((1,65)),np.zeros((1,65)),5,cv2.GC_INIT_WITH_MASK)
    alpha=np.where((mask==cv2.GC_FGD)|(mask==cv2.GC_PR_FGD),255,0).astype(np.uint8)
    if spec.get('largest'):
        count,labels,stats,_=cv2.connectedComponentsWithStats(alpha)
        if count>1:alpha=np.where(labels==1+np.argmax(stats[1:,cv2.CC_STAT_AREA]),255,0).astype(np.uint8)
    if spec.get('manual'):alpha=silhouette
    alpha=Image.fromarray(alpha)
    rgba=photo.convert('RGBA');rgba.putalpha(alpha)
    bbox=alpha.getbbox()
    rgba=rgba.crop(bbox)
    rgba.thumbnail((880,1050),Image.Resampling.LANCZOS)
    canvas=Image.new('RGB',(1000,1200),(243,238,229))
    canvas.paste(rgba,((1000-rgba.width)//2,1120-rgba.height),rgba)
    target=out/(row['source']+'-'+row['handle']+'.webp')
    canvas.save(target,'WEBP',quality=91,method=6)
    print(key,target.name,flush=True)
