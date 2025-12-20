from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import Token, User, UserCreate
from app.core.security import create_access_token
from app.crud.user import user as crud_user
from app.schemas import ResponseModel
from app.dependencies import get_current_active_user

router = APIRouter()

@router.post("/login", response_model=ResponseModel[Token])
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = crud_user.authenticate(db, username=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    access_token = create_access_token(subject=user.username)
    
    return ResponseModel(
        data=Token(access_token=access_token, token_type="bearer"),
        message="Login successful"
    )

@router.post("/register", response_model=ResponseModel[User])
def register(
    user_in: UserCreate,
    db: Session = Depends(get_db)
):
    # Проверяем, существует ли пользователь
    if crud_user.get_by_username(db, username=user_in.username):
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )
    if crud_user.get_by_email(db, email=user_in.email):
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )
    
    user = crud_user.create(db, obj_in=user_in)
    return ResponseModel(
        data=user,
        message="User registered successfully"
    )

@router.get("/me", response_model=ResponseModel[User])
def read_users_me(current_user: User = Depends(get_current_active_user)):
    return ResponseModel(data=current_user)