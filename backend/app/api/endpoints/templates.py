# backend\app\api\endpoints\templates.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.schemas.template import WorkoutTemplate, WorkoutTemplateCreate, WorkoutTemplateUpdate
from app.schemas import ResponseModel
from app.crud.template import workout_template as crud_template
from app.dependencies import get_current_active_user

router = APIRouter()

@router.post("/", response_model=ResponseModel[WorkoutTemplate])
def create_workout_template(
    template_in: WorkoutTemplateCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    template = crud_template.create_with_exercises(db, obj_in=template_in, user_id=current_user.id)
    return ResponseModel(data=template, message="Workout template created")

@router.get("/", response_model=ResponseModel[List[WorkoutTemplate]])
def read_workout_templates(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    templates = crud_template.get_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    return ResponseModel(data=templates)

@router.get("/public", response_model=ResponseModel[List[WorkoutTemplate]])
def read_public_templates(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    templates = crud_template.get_public_templates(db, skip=skip, limit=limit)
    return ResponseModel(data=templates)

@router.get("/{template_id}", response_model=ResponseModel[WorkoutTemplate])
def read_workout_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    template = crud_template.get(db, id=template_id)
    if not template or (template.user_id != current_user.id and not template.is_public):
        raise HTTPException(status_code=404, detail="Template not found")
    return ResponseModel(data=template)

@router.put("/{template_id}", response_model=ResponseModel[WorkoutTemplate])
def update_workout_template(
    template_id: int,
    template_in: WorkoutTemplateUpdate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    template = crud_template.get(db, id=template_id)
    if not template or template.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template = crud_template.update(db, db_obj=template, obj_in=template_in)
    return ResponseModel(data=template, message="Template updated")

@router.delete("/{template_id}")
def delete_workout_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    template = crud_template.get(db, id=template_id)
    if not template or template.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Template not found")
    
    crud_template.remove(db, id=template_id)
    return ResponseModel(message="Template deleted")

@router.post("/{template_id}/create-workout")
def create_workout_from_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_active_user)
):
    result = crud_template.create_workout_from_template(db, template_id=template_id, user_id=current_user.id)
    
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    
    return ResponseModel(data=result["workout"], message=result["message"])