# backend\app\api\endpoints\users.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.user import User, UserUpdate
from app.schemas import ResponseModel
from app.crud.user import user as crud_user
from app.dependencies import get_current_active_user

router = APIRouter()

@router.get("/", response_model=ResponseModel[List[User]])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    users = crud_user.get_multi(db, skip=skip, limit=limit)
    return ResponseModel(data=users)

@router.put("/me", response_model=ResponseModel[User])
def update_user_me(
    user_in: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    user = crud_user.update(db, db_obj=current_user, obj_in=user_in)
    return ResponseModel(data=user, message="User updated successfully")

@router.get("/{user_id}", response_model=ResponseModel[User])
def read_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    user = crud_user.get(db, id=user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return ResponseModel(data=user)