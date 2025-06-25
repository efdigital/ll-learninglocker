import catchErrors from 'api/controllers/utils/catchErrors';
import PersonaAttribute from 'lib/models/personaAttribute';
import getAuthFromRequest from 'lib/helpers/getAuthFromRequest';
import getScopeFilter from 'lib/services/auth/filters/getScopeFilter';
import getOrgFromAuthInfo from 'lib/services/auth/authInfoSelectors/getOrgFromAuthInfo';
import { contextFilter } from 'lib/constants/auth';

const MODEL_NAME = 'personaattribute';

/**
 * Get all PersonaAttributes
 */
const getPersonaAttributes = catchErrors(async (req, res) => {
  const authInfo = getAuthFromRequest(req);

  // Check user has read permissions
  await getScopeFilter({
    modelName: MODEL_NAME,
    actionName: 'view',
    authInfo
  });

  try {
    const organisation = getOrgFromAuthInfo(authInfo);
    const personaAttributes = await PersonaAttribute.find({ organisation });
    return res.json(personaAttributes);
  } catch (error) {
    console.error('Error fetching PersonaAttributes:', error);
    return res.status(500).json({
      error: 'Internal server error while fetching PersonaAttributes'
    });
  }
});

/**
 * Get a single PersonaAttribute by ID
 */
const getPersonaAttribute = catchErrors(async (req, res) => {
  const authInfo = getAuthFromRequest(req);

  // Check user has read permissions
  await getScopeFilter({
    modelName: MODEL_NAME,
    actionName: 'view',
    authInfo
  });

  const { personaAttributeId } = req.params;
  const organisation = getOrgFromAuthInfo(authInfo);

  if (!personaAttributeId) {
    return res.status(400).json({
      error: 'PersonaAttribute ID is required'
    });
  }

  try {
    const personaAttribute = await PersonaAttribute.findOne({
      _id: personaAttributeId,
      organisation
    });

    if (!personaAttribute) {
      return res.status(404).json({
        error: 'PersonaAttribute not found or access denied'
      });
    }

    return res.json(personaAttribute);
  } catch (error) {
    console.error('Error fetching PersonaAttribute:', error);
    return res.status(500).json({
      error: 'Internal server error while fetching PersonaAttribute'
    });
  }
});

/**
 * Create a new PersonaAttribute
 */
const createPersonaAttribute = catchErrors(async (req, res) => {
  const authInfo = getAuthFromRequest(req);

  // Check user has create permissions
  await getScopeFilter({
    modelName: MODEL_NAME,
    actionName: 'create',
    authInfo
  });

  try {
    const organisation = getOrgFromAuthInfo(authInfo);
    const personaAttributeData = {
      ...req.body,
      organisation
    };

    const personaAttribute = await PersonaAttribute.create(personaAttributeData);
    return res.status(201).json(personaAttribute);
  } catch (error) {
    console.error('Error creating PersonaAttribute:', error);
    return res.status(500).json({
      error: 'Internal server error while creating PersonaAttribute'
    });
  }
});

/**
 * Update a PersonaAttribute by ID
 */
const updatePersonaAttribute = catchErrors(async (req, res) => {
  const authInfo = getAuthFromRequest(req);

  // Check user has edit permissions
  await getScopeFilter({
    modelName: MODEL_NAME,
    actionName: 'edit',
    authInfo
  });

  const { personaAttributeId } = req.params;
  const organisation = getOrgFromAuthInfo(authInfo);

  if (!personaAttributeId) {
    return res.status(400).json({
      error: 'PersonaAttribute ID is required'
    });
  }

  try {
    const personaAttribute = await PersonaAttribute.findOneAndUpdate(
      {
        _id: personaAttributeId,
        organisation
      },
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!personaAttribute) {
      return res.status(404).json({
        error: 'PersonaAttribute not found or access denied'
      });
    }

    return res.json(personaAttribute);
  } catch (error) {
    console.error('Error updating PersonaAttribute:', error);
    return res.status(500).json({
      error: 'Internal server error while updating PersonaAttribute'
    });
  }
});

/**
 * Delete a PersonaAttribute by ID
 * Custom implementation to work around express-restify-mongoose Mongoose 8 compatibility issues
 */
const deletePersonaAttribute = catchErrors(async (req, res) => {
  const authInfo = getAuthFromRequest(req);

  // Check user has delete permissions
  await getScopeFilter({
    modelName: MODEL_NAME,
    actionName: 'delete',
    authInfo
  });

  const { personaAttributeId } = req.params;
  const organisation = getOrgFromAuthInfo(authInfo);

  if (!personaAttributeId) {
    return res.status(400).json({
      error: 'PersonaAttribute ID is required'
    });
  }

  try {
    // Find the PersonaAttribute first to ensure it exists and belongs to the org
    const personaAttribute = await PersonaAttribute.findOne({
      _id: personaAttributeId,
      organisation
    });

    if (!personaAttribute) {
      return res.status(404).json({
        error: 'PersonaAttribute not found or access denied'
      });
    }

    // Delete the PersonaAttribute
    await PersonaAttribute.deleteOne({
      _id: personaAttributeId,
      organisation
    });

    // Return success response (204 No Content is standard for successful DELETE)
    return res.status(204).send();

  } catch (error) {
    console.error('Error deleting PersonaAttribute:', error);
    return res.status(500).json({
      error: 'Internal server error while deleting PersonaAttribute'
    });
  }
});

export default {
  getPersonaAttributes,
  getPersonaAttribute,
  createPersonaAttribute,
  updatePersonaAttribute,
  deletePersonaAttribute
};