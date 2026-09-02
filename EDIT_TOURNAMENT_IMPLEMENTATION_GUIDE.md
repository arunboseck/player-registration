# EditTournament.jsx - Multiple Organizers Implementation Guide

## Current Status
- ✅ AddTournament.jsx - COMPLETE with multiple organizers
- ✅ TournamentRegister.jsx - COMPLETE with multiple organizers display
- ⏳ EditTournament.jsx - IN PROGRESS

## Quick Implementation Approach

The fastest way is to copy the entire structure from AddTournament.jsx since it already has all the multiple organizers logic working perfectly.

### Method: Copy and Modify AddTournament.jsx

1. **Copy the file:**
   ```bash
   cp src/pages/AddTournament.jsx src/pages/EditTournament.jsx
   ```

2. **Update imports (line 3):**
   ```javascript
   // Change from:
   import { addTournament, uploadPhotoToStorage } from '../utils/firebaseStorage';
   
   // To:
   import { getTournamentById, updateTournament, uploadPhotoToStorage } from '../utils/firebaseStorage';
   ```

3. **Update component name (line 9):**
   ```javascript
   // Change from:
   const AddTournament = () => {
   
   // To:
   const EditTournament = () => {
   ```

4. **Add useParams (line 2 and 11):**
   ```javascript
   // Line 2:
   import { useNavigate, useParams } from 'react-router-dom';
   
   // Line 11 (after const navigate):
   const { id } = useParams();
   ```

5. **Add loading state (line 27):**
   ```javascript
   const [loading, setLoading] = useState(true);
   ```

6. **Add useEffect to load tournament (after state initialization):**
   ```javascript
   useEffect(() => {
     const loadTournament = async () => {
       const tournament = await getTournamentById(id);
       if (tournament) {
         const { organizers: tournamentOrganizers, ...tournamentData } = tournament;
         setFormData(tournamentData);
         
         if (tournamentOrganizers && Array.isArray(tournamentOrganizers) && tournamentOrganizers.length > 0) {
           setOrganizers(tournamentOrganizers.map(org => ({
             ...org,
             photoPreview: org.photo || null
           })));
         } else if (tournament.organizerName) {
           setOrganizers([{
             name: tournament.organizerName || '',
             mobile: tournament.organizerMobile || '',
             photo: tournament.organizerPhoto || '',
             photoPreview: tournament.organizerPhoto || null
           }]);
         }
         
         if (tournament.tournamentPoster) {
           setPosterPreview(tournament.tournamentPoster);
         }
         
         setLoading(false);
       } else {
         alert('Tournament not found!');
         navigate('/tournaments');
       }
     };
     loadTournament();
   }, [id, navigate]);
   ```

7. **Update handleSubmit function:**
   ```javascript
   // Change the final part from:
   await addTournament(tournamentData);
   alert('Tournament created successfully!');
   
   // To:
   await updateTournament(id, tournamentData);
   alert('Tournament updated successfully!');
   ```

8. **Update UI text:**
   - Title: "Add New Tournament" → "Edit Tournament"
   - Button: "Create Tournament" → "Update Tournament"
   - Button state: "Creating Tournament..." → "Updating Tournament..."

9. **Add loading check in render:**
   ```javascript
   if (loading) {
     return <div>Loading tournament...</div>;
   }
   ```

10. **Update export (last line):**
    ```javascript
    // Change from:
    export default AddTournament;
    
    // To:
    export default EditTournament;
    ```

## Result
After these changes, EditTournament.jsx will have full multiple organizers support with:
- Add/Remove organizer buttons
- Individual validation
- Photo upload for each organizer
- Beautiful card-based UI
- Backward compatibility with old single-organizer format
