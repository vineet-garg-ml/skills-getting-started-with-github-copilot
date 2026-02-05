from fastapi.testclient import TestClient
import copy
import pytest

from src.app import app, activities as activities_db

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_activities():
    # Keep a deep copy of the original activities and restore after each test
    original = copy.deepcopy(activities_db)
    yield
    activities_db.clear()
    activities_db.update(copy.deepcopy(original))


def test_get_activities():
    res = client.get("/activities")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, dict)
    # Sample known activity
    assert "Chess Club" in data


def test_signup_success():
    email = "teststudent@example.com"
    res = client.post("/activities/Chess Club/signup", params={"email": email})
    assert res.status_code == 200
    body = res.json()
    assert "Signed up" in body.get("message", "")
    # Verify participant added
    assert email in activities_db["Chess Club"]["participants"]


def test_signup_duplicate_fails():
    email = "emma@mergington.edu"  # already signed up in fixtures
    res = client.post("/activities/Programming Class/signup", params={"email": email})
    assert res.status_code == 400


def test_signup_nonexistent_activity():
    email = "someone@example.com"
    res = client.post("/activities/Nonexistent/signup", params={"email": email})
    assert res.status_code == 404


def test_unregister_participant_success():
    email = "michael@mergington.edu"
    res = client.delete("/activities/Chess Club/participants", params={"email": email})
    assert res.status_code == 200
    body = res.json()
    assert "Removed" in body.get("message", "")
    assert email not in activities_db["Chess Club"]["participants"]


def test_unregister_nonexistent_participant_fails():
    email = "noone@example.com"
    res = client.delete("/activities/Chess Club/participants", params={"email": email})
    assert res.status_code == 404


def test_unregister_nonexistent_activity():
    email = "someone@example.com"
    res = client.delete("/activities/NoActivity/participants", params={"email": email})
    assert res.status_code == 404
